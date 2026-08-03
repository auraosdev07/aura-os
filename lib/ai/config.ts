/**
 * lib/ai/config.ts
 *
 * Provider Configuration & Secure Environment API Key Management for Aura OS.
 * Guarantees API keys are NEVER exposed to the client or returned in API responses.
 */

import { aiRegistry } from "./registry";
import { resolveGeminiModel } from "./providers/gemini-fallback";
import type { HealthCheckResult } from "./types";

export type HealthStatusType =
  | "Connected"
  | "Invalid API Key"
  | "Network Error"
  | "Rate Limited"
  | "Provider Error"
  | "Disabled"
  | "Unconfigured";

export interface ProviderConfig {
  name: "openai" | "gemini";
  enabled: boolean;
  hasApiKey: boolean;
  model: string;
  healthStatus: HealthStatusType;
}

export interface SystemAIConfig {
  activeProvider: string;
  providers: Record<string, ProviderConfig>;
}

/**
 * Get sanitized system AI provider configurations.
 * NEVER returns raw API key strings.
 */
export async function getProviderConfigurations(): Promise<SystemAIConfig> {
  const activeProvider = aiRegistry.getActiveProviderName();

  const openaiHasKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
  const geminiHasKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
    (process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim().length > 0)
  );

  const openaiConfig: ProviderConfig = {
    name: "openai",
    enabled: openaiHasKey,
    hasApiKey: openaiHasKey,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    healthStatus: openaiHasKey ? "Connected" : "Unconfigured",
  };

  const geminiConfig: ProviderConfig = {
    name: "gemini",
    enabled: geminiHasKey,
    hasApiKey: geminiHasKey,
    model: resolveGeminiModel(),
    healthStatus: geminiHasKey ? "Connected" : "Unconfigured",
  };

  return {
    activeProvider,
    providers: {
      openai: openaiConfig,
      gemini: geminiConfig,
    },
  };
}

/**
 * Test health status for specified provider and map error details safely.
 */
export async function testProviderHealth(providerName: string): Promise<HealthCheckResult & {
  status: HealthStatusType;
}> {
  const normalizedName = providerName.toLowerCase();

  try {
    const provider = aiRegistry.getProvider(normalizedName);
    const result = await provider.healthCheck();

    if (result.ok) {
      return {
        ...result,
        status: "Connected",
        message: result.message || "Provider connection successful.",
      };
    }

    const msg = (result.message || "").toLowerCase();
    let status: HealthStatusType = "Provider Error";

    if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("invalid")) {
      status = "Invalid API Key";
    } else if (msg.includes("rate limit") || msg.includes("429") || msg.includes("quota")) {
      status = "Rate Limited";
    } else if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("econnrefused")) {
      status = "Network Error";
    }

    return {
      ok: false,
      provider: normalizedName,
      status,
      message: result.message || "Health check failed.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error during health check.";
    const lowerMsg = errMsg.toLowerCase();

    let status: HealthStatusType = "Provider Error";
    if (lowerMsg.includes("api key") || lowerMsg.includes("401")) {
      status = "Invalid API Key";
    } else if (lowerMsg.includes("network") || lowerMsg.includes("fetch")) {
      status = "Network Error";
    }

    return {
      ok: false,
      provider: normalizedName,
      status,
      message: errMsg,
    };
  }
}
