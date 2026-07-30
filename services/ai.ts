"use server";

/**
 * services/ai.ts
 *
 * Business logic layer & Server Actions for AI operations in Aura OS.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import {
  generateText,
  generateJSON,
  healthCheck,
  getAIProvider,
} from "@/lib/ai/client";
import type {
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  HealthCheckResult,
  AIUsageLogPayload,
} from "@/lib/ai/types";

import { retrieveContext } from "@/lib/rag/retriever";

export interface AIProviderConfigInfo {
  activeProvider: string;
  availableProviders: string[];
}

/**
 * Get current AI provider configuration & available providers list.
 */
export async function getAIProviderConfigAction(): Promise<AIProviderConfigInfo> {
  await getServerContext();
  const activeProvider = getAIProvider().name;
  return {
    activeProvider,
    availableProviders: ["gemini", "openai"],
  };
}

/**
 * Perform a health check on the active or specified AI provider.
 */
export async function healthCheckAction(providerName?: string): Promise<HealthCheckResult> {
  await getServerContext();
  return healthCheck(providerName);
}

/**
 * Server action to generate text completion with RAG Context Injection.
 */
export async function generateTextAction(
  options: GenerateTextOptions,
  providerName?: string
): Promise<GenerateTextResult> {
  const { user } = await getServerContext();
  const startTime = Date.now();

  // Retrieve RAG context safely without breaking primary generation
  let ragStatus: "Enabled" | "None" | "Error" = "None";
  let retrievedChunkCount = 0;
  let retrievedTokenCount = 0;
  let retrievalLatencyMs = 0;
  let formattedContext = "";

  try {
    const retrievalStart = Date.now();
    const userQuery =
      options.messages?.filter((m) => m.role === "user").slice(-1)[0]?.content || "";

    if (userQuery.trim()) {
      const contextRes = await retrieveContext({
        query: userQuery,
        maxTokens: 2000,
      });
      retrievalLatencyMs = Date.now() - retrievalStart;
      retrievedChunkCount = contextRes.chunks.length;
      retrievedTokenCount = contextRes.totalTokens;

      if (contextRes.chunks.length > 0) {
        ragStatus = "Enabled";
        formattedContext = contextRes.formattedContext;
      }
    }
  } catch (err) {
    console.error("[RAG RETRIEVAL ERROR in generateTextAction]:", err);
    ragStatus = "Error";
  }

  console.log("[RAG RETRIEVAL LOG]", {
    chunkCount: retrievedChunkCount,
    tokenCount: retrievedTokenCount,
    latencyMs: retrievalLatencyMs,
    status: ragStatus,
  });

  // Prepare updated options with injected RAG context (never overwriting system prompt)
  const updatedOptions: GenerateTextOptions = { ...options };
  if (formattedContext && updatedOptions.messages && updatedOptions.messages.length > 0) {
    const sysMsgIndex = updatedOptions.messages.findIndex((m) => m.role === "system");
    if (sysMsgIndex !== -1) {
      const updatedMessages = [...updatedOptions.messages];
      updatedMessages[sysMsgIndex] = {
        ...updatedMessages[sysMsgIndex],
        content: `${updatedMessages[sysMsgIndex].content}\n\n${formattedContext}`,
      };
      updatedOptions.messages = updatedMessages;
    } else {
      updatedOptions.messages = [
        { role: "system", content: formattedContext },
        ...updatedOptions.messages,
      ];
    }
  }

  try {
    const result = await generateText(updatedOptions, providerName);
    const latencyMs = Date.now() - startTime;

    // Log usage
    await logAIUsageAction({
      ownerId: user.id,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      totalTokens: result.usage?.totalTokens || 0,
      latencyMs,
      status: "success",
    });

    return result;
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    await logAIUsageAction({
      ownerId: user.id,
      provider: providerName || getAIProvider().name,
      model: options.model || "unknown",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs,
      status: "error",
    }).catch(() => {});

    throw err;
  }
}

/**
 * Server action to generate structured JSON output.
 */
export async function generateJSONAction<T = unknown>(
  options: GenerateJSONOptions,
  providerName?: string
): Promise<T> {
  await getServerContext();
  return generateJSON<T>(options, providerName);
}

/**
 * Server action / helper to log AI usage metrics.
 * Prepared for database persistence (`ai_usage_logs`).
 */
export async function logAIUsageAction(payload: AIUsageLogPayload): Promise<void> {
  // In Phase 1, log to internal logger / console
  if (process.env.NODE_ENV === "development") {
    console.log("[AI USAGE LOG]", {
      ownerId: payload.ownerId,
      provider: payload.provider,
      model: payload.model,
      promptTokens: payload.promptTokens,
      completionTokens: payload.completionTokens,
      totalTokens: payload.totalTokens,
      latencyMs: payload.latencyMs,
      status: payload.status,
    });
  }
}
