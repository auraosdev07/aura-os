"use server";

/**
 * services/ai.ts
 *
 * Business logic layer & Server Actions for AI operations in Aura OS.
 * Integrated with Sprint 14 Multi-Turn Agent Loop & Domain Tool Framework.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import {
  generateJSON,
  getAIProvider,
} from "@/lib/ai/client";
import type {
  AIMessage,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  AIUsageLogPayload,
} from "@/lib/ai/types";

import { retrieveContext } from "@/lib/rag/retriever";
import { getProviderConfigurations, testProviderHealth, type SystemAIConfig } from "@/lib/ai/config";
import { aiRegistry } from "@/lib/ai/registry";
import { runAgentLoop } from "@/lib/ai/agent/loop";
import { aiToolRegistry } from "@/lib/ai/tools/registry";
import type { ToolContext } from "@/lib/ai/tools/types";
import { generatePlan } from "@/lib/ai/planner/planner";
import { retrieveMemoryContext } from "@/lib/ai/memory/memory-retriever";
import { evaluateAndWriteMemory } from "@/lib/ai/memory/memory-writer";
import { fetchWithGeminiFallback, resolveGeminiModel } from "@/lib/ai/providers/gemini-fallback";
import "@/lib/ai/tools/definitions"; // Bootstrap all domain tools into AIToolRegistry

export interface AIProviderConfigInfo extends SystemAIConfig {
  availableProviders: string[];
}

/**
 * Get current AI provider configurations & available providers list.
 * Never returns raw API keys.
 */
export async function getAIProviderConfigAction(): Promise<AIProviderConfigInfo> {
  await getServerContext();
  const config = await getProviderConfigurations();
  return {
    ...config,
    availableProviders: ["gemini", "openai"],
  };
}

/**
 * Set the currently active AI provider dynamically at runtime.
 */
export async function setActiveProviderAction(providerName: string): Promise<{ success: boolean; activeProvider: string }> {
  await getServerContext();
  aiRegistry.setActiveProviderName(providerName);
  return {
    success: true,
    activeProvider: aiRegistry.getActiveProviderName(),
  };
}

/**
 * Perform a health check on the active or specified AI provider.
 */
export async function healthCheckAction(providerName?: string) {
  await getServerContext();
  const target = providerName || aiRegistry.getActiveProviderName();
  return testProviderHealth(target);
}

/**
 * Server action to generate text completion with RAG Context Injection and Agent Loop Integration.
 */
export async function generateTextAction(
  options: GenerateTextOptions,
  providerName?: string
): Promise<GenerateTextResult> {
  const { user } = await getServerContext();
  const startTime = Date.now();
  const activeProviderName = (providerName || aiRegistry.getActiveProviderName()).toLowerCase();

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

  // Retrieve candidate memories safely for Planning Agent
  let candidateMemories: import("@/lib/ai/memory/memory-types").MemoryItem[] = [];
  const userQuery = options.messages?.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
  try {
    if (userQuery.trim()) {
      const memoryRes = await retrieveMemoryContext({ ownerId: user.id, query: userQuery });
      candidateMemories = memoryRes.rawMemories || [];
    }
  } catch (err) {
    console.error("[MEMORY RETRIEVAL ERROR in generateTextAction]:", err);
  }

  // Build Tool Context and load enabled domain tool definitions
  const toolContext: ToolContext = { ownerId: user.id };
  const toolDefinitions = aiToolRegistry.getEnabledToolDefinitions(toolContext);

  // Sprint 17C: Memory-Aware Planning Agent Flow
  const plan = await generatePlan({
    userQuery,
    availableTools: toolDefinitions.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
    memories: candidateMemories.map((m) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      importance: m.importance,
    })),
    provider: activeProviderName === "openai" ? "openai" : "gemini",
    model: options.model,
  });

  const effectiveToolDefs = plan.requiresTools ? toolDefinitions : [];

  // Inject ONLY selected memories approved by Planner into execution context
  if (
    plan.memoryDecision === "use_memory" &&
    plan.selectedMemories &&
    plan.selectedMemories.length > 0
  ) {
    const selectedSet = new Set(plan.selectedMemories);
    const selected = candidateMemories.filter((m) => selectedSet.has(m.id));
    if (selected.length > 0) {
      const lines = selected.map(
        (m) => `- [${m.type.toUpperCase()}] ${m.content} (Importance: ${m.importance}/10)`
      );
      const memoryContextStr = `### Remembered User Context & Facts\n${lines.join("\n")}`;
      formattedContext = formattedContext
        ? `${formattedContext}\n\n${memoryContextStr}`
        : memoryContextStr;
    }
  }

  console.log("[RAG & MEMORY LOG]", {
    chunkCount: retrievedChunkCount,
    tokenCount: retrievedTokenCount,
    latencyMs: retrievalLatencyMs,
    status: ragStatus,
    memoryDecision: plan.memoryDecision,
    selectedMemoriesCount: plan.selectedMemories?.length || 0,
  });

  // Prepare updated options with injected RAG & selected Memory context
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

  // Provider invocation callback for Agent Loop
  const providerCallFn = async (
    messages: AIMessage[],
    formattedTools?: unknown[]
  ): Promise<{ text: string; rawResponse?: unknown }> => {
    if (activeProviderName === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
      const model = options.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

      const body: Record<string, unknown> = {
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      };
      if (formattedTools && formattedTools.length > 0) {
        body.tools = formattedTools;
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI API error: HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return { text, rawResponse: data };
    } else {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

      const contents: { role: string; parts: { text: string }[] }[] = [];
      let systemInstruction: { parts: { text: string }[] } | undefined = undefined;

      for (const msg of messages) {
        if (msg.role === "system") {
          systemInstruction = { parts: [{ text: msg.content }] };
        } else {
          const geminiRole = msg.role === "assistant" ? "model" : "user";
          contents.push({
            role: geminiRole,
            parts: [{ text: msg.content }],
          });
        }
      }

      const body: Record<string, unknown> = { contents };
      if (systemInstruction) body.systemInstruction = systemInstruction;
      if (formattedTools && formattedTools.length > 0) {
        body.tools = formattedTools;
      }

      const { response: res } = await fetchWithGeminiFallback({
        apiKey,
        endpointSuffix: ":generateContent",
        fetchOptions: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        requestedModel: options.model,
      });

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const textPart = parts.find((p: Record<string, unknown>) => typeof p.text === "string");
      const text = textPart ? textPart.text : "";

      return { text, rawResponse: data };
    }
  };

  try {
    const loopResult = await runAgentLoop({
      messages: updatedOptions.messages,
      provider: activeProviderName === "openai" ? "openai" : "gemini",
      toolDefinitions: effectiveToolDefs,
      context: toolContext,
      maxIterations: 5,
      providerCallFn,
    });

    const latencyMs = Date.now() - startTime;
    const finalModel = options.model || (activeProviderName === "openai" ? "gpt-4o-mini" : resolveGeminiModel());

    const result: GenerateTextResult = {
      text: loopResult.finalText || loopResult.text || "",
      model: finalModel,
      provider: activeProviderName,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };

    // Log usage
    await logAIUsageAction({
      ownerId: user.id,
      provider: result.provider,
      model: result.model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs,
      status: "success",
    });

    // Evaluate and write high-value memories asynchronously
    const userQuery = options.messages?.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
    evaluateAndWriteMemory({
      ownerId: user.id,
      userQuery,
      assistantResponse: result.text,
    }).catch(() => {});

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
  console.log("[AI USAGE LOG]", {
    ownerId: payload.ownerId,
    provider: payload.provider,
    model: payload.model,
    promptTokens: payload.promptTokens,
    completionTokens: payload.completionTokens,
    totalTokens: payload.totalTokens,
    latencyMs: payload.latencyMs,
    status: payload.status,
    timestamp: new Date().toISOString(),
  });
}
