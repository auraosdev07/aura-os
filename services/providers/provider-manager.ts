/**
 * services/providers/provider-manager.ts
 *
 * Aura OS Provider Orchestrator & Manager
 * Fully registry-driven, capability-aware, multi-provider execution engine with automatic failover,
 * dynamic telemetry, and cost optimizer foundation.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { resolveProvider } from "./provider-factory";
import { getProviderSettings, getSystemAiConfig } from "./provider-settings-service";
import {
  getAllProviderMetadata,
  getProviderMetadata,
  isProviderEnvConfigured,
} from "./provider-metadata-registry";
import type { PromptInput, ProviderResponse, BaseProvider } from "./base-provider";
import type { ProviderCapabilities } from "@/types/provider";

export interface ProviderTelemetryEntry {
  provider: string;
  displayName: string;
  requestsServed: number;
  successes: number;
  failures: number;
  promptTokens: number;
  completionTokens: number;
  lastFailureReason: string | null;
  lastFailureTime: string | null;
  health: "HEALTHY" | "DEGRADED" | "DISCONNECTED";
  successRate: number; // Percentage
  avgLatencyMs: number;
  healthScore: number;
}

export interface ProviderManagerStatus {
  activeProvider: string;
  fallbackProvider: string | null;
  autoFailover: boolean;
  priorityOrder: string[];
  providerStats: ProviderTelemetryEntry[];
  totalRequests: number;
  overallSuccessRate: number;
}

// In-Memory Dynamic Telemetry Tracker
const telemetryStore: Record<
  string,
  {
    requestsServed: number;
    successes: number;
    failures: number;
    promptTokens: number;
    completionTokens: number;
    totalLatencyMs: number;
    lastFailureReason: string | null;
    lastFailureTime: string | null;
    lastUsedAt: string | null;
  }
> = {};

function getOrCreateTelemetry(providerId: string) {
  const key = providerId.toLowerCase();
  if (!telemetryStore[key]) {
    telemetryStore[key] = {
      requestsServed: 0,
      successes: 0,
      failures: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalLatencyMs: 0,
      lastFailureReason: null,
      lastFailureTime: null,
      lastUsedAt: null,
    };
  }
  return telemetryStore[key];
}

/**
 * Checks whether an error constitutes a failover condition (429, 401, 403, 500, 502, 503, 504, timeout, network error, auth error, quota exhausted, etc.)
 */
function isFailoverError(errorMsg?: string): boolean {
  if (!errorMsg) return true;
  const lower = errorMsg.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("timeout") ||
    lower.includes("network") ||
    lower.includes("unavailable") ||
    lower.includes("auth") ||
    lower.includes("authentication") ||
    lower.includes("unauthorized") ||
    lower.includes("missing") ||
    lower.includes("unconfigured") ||
    lower.includes("failed")
  );
}

/**
 * Infers required capability from prompt input if not explicitly provided.
 */
function detectRequiredCapability(
  input: PromptInput,
  options?: { requiredCapability?: keyof ProviderCapabilities }
): keyof ProviderCapabilities {
  if (options?.requiredCapability) {
    return options.requiredCapability;
  }
  const text = (input.systemPrompt + " " + input.userPrompt).toLowerCase();
  if (text.includes("image") || text.includes("vision") || text.includes("http://") || text.includes("https://")) {
    if (text.includes(".jpg") || text.includes(".png") || text.includes(".webp") || text.includes("data:image")) {
      return "vision";
    }
  }
  return "chat";
}

export class ProviderManager {
  /**
   * Main transparent generation method for Execution Engine.
   * Execution Engine calls ProviderManager.generate(promptInput) without knowing which provider runs.
   * Uses Capability-Based Routing, DB Priority, and Automatic Failover.
   */
  static async generate(
    input: PromptInput,
    options?: { taskId?: string; agentId?: string; requiredCapability?: keyof ProviderCapabilities }
  ): Promise<{ response: ProviderResponse; activeProvider: string; usedFallback: boolean }> {
    const { supabase } = await getServerContext();
    const sysConfig = await getSystemAiConfig();
    const dbProviders = await getProviderSettings();
    const allMetadata = getAllProviderMetadata();

    const primaryName = (sysConfig.default_provider || "gemini").toLowerCase();
    const autoFailover = sysConfig.enable_fallback;
    const requiredCap = detectRequiredCapability(input, options);

    // 1. Filter Providers by Capability & Configured/Enabled status
    const capableMetadata = allMetadata.filter((m) => m.capabilities[requiredCap] === true);

    // Sort capable providers by priority (DB priority_order overrides registry metadata)
    const sortedProviders = capableMetadata.map((meta) => {
      const dbRow = dbProviders.find((p) => p.provider.toLowerCase() === meta.providerId.toLowerCase());
      const priority = dbRow?.priority_order ?? meta.priority;
      const isEnabled = dbRow ? dbRow.is_enabled : meta.enabledByDefault;
      const isConfigured = isProviderEnvConfigured(meta) || Boolean(dbRow?.api_key && !dbRow.api_key.includes("Not set"));
      return { meta, dbRow, priority, isEnabled, isConfigured };
    }).sort((a, b) => a.priority - b.priority);

    // Filter out disabled or completely unconfigured providers
    let activeCandidates = sortedProviders.filter((p) => p.isEnabled && p.isConfigured);

    // If primary provider is candidate, put it first; otherwise follow priority order
    if (activeCandidates.some((c) => c.meta.providerId.toLowerCase() === primaryName)) {
      activeCandidates = [
        ...activeCandidates.filter((c) => c.meta.providerId.toLowerCase() === primaryName),
        ...activeCandidates.filter((c) => c.meta.providerId.toLowerCase() !== primaryName),
      ];
    }

    const providersToTry = autoFailover ? activeCandidates : activeCandidates.slice(0, 1);

    if (providersToTry.length === 0) {
      // Fallback to any registered provider if none matched candidate filters
      const emergencyFallback = sortedProviders[0]?.meta.providerId || primaryName;
      return {
        response: {
          success: false,
          output: "",
          responseType: "FINAL_RESPONSE",
          usage: { promptTokens: 0, completionTokens: 0 },
          model: "unknown",
          providerName: emergencyFallback.toUpperCase(),
          error: `No configured AI provider supports required capability '${requiredCap}'.`,
        },
        activeProvider: emergencyFallback,
        usedFallback: false,
      };
    }

    let lastResponse: ProviderResponse | null = null;
    let lastError = "";

    for (let i = 0; i < providersToTry.length; i++) {
      const candidate = providersToTry[i];
      const provId = candidate.meta.providerId.toLowerCase();
      const dbConfig = candidate.dbRow;

      const providerInstance: BaseProvider = resolveProvider(provId.toUpperCase());
      const startTime = Date.now();

      // Execute Prompt
      const res = await providerInstance.executePrompt(
        {
          systemPrompt: input.systemPrompt,
          userPrompt: input.userPrompt,
          history: input.history,
          model: dbConfig?.model || candidate.meta.defaultModel,
          temperature: input.temperature ?? 0.7,
          maxTokens: input.maxTokens ?? 2048,
        },
        {
          provider: provId.toUpperCase(),
          model: dbConfig?.model || candidate.meta.defaultModel,
          temperature: 0.7,
          maxTokens: 2048,
        }
      );

      const durationMs = Date.now() - startTime;
      const stats = getOrCreateTelemetry(provId);
      stats.requestsServed++;
      stats.lastUsedAt = new Date().toISOString();

      if (res.success) {
        stats.successes++;
        stats.totalLatencyMs += durationMs;
        stats.promptTokens += res.usage.promptTokens;
        stats.completionTokens += res.usage.completionTokens;

        if (i > 0 && options?.taskId) {
          // Log Fallback Event in task_events
          await supabase.from("task_events").insert({
            task_id: options.taskId,
            agent_id: options.agentId || null,
            event_type: "PROVIDER_FAILOVER",
            message: `Primary provider '${primaryName.toUpperCase()}' failed. Auto-failover to '${provId.toUpperCase()}' succeeded in ${durationMs}ms.`,
            details: { primaryProvider: primaryName, activeProvider: provId, attemptsCount: i + 1, durationMs },
          });
        }

        return {
          response: res,
          activeProvider: provId,
          usedFallback: i > 0,
        };
      }

      // Record Failure
      lastError = res.error || `Provider '${provId.toUpperCase()}' returned failure.`;
      stats.failures++;
      stats.lastFailureReason = lastError;
      stats.lastFailureTime = new Date().toISOString();

      if (options?.taskId) {
        await supabase.from("task_events").insert({
          task_id: options.taskId,
          agent_id: options.agentId || null,
          event_type: "PROVIDER_FAILED",
          message: `Provider '${provId.toUpperCase()}' failed: ${lastError}`,
          details: { provider: provId, error: lastError, attemptNumber: i + 1 },
        });
      }

      if (!isFailoverError(lastError) && !autoFailover) {
        break; // Stop if non-retriable and fallback disabled
      }

      lastResponse = res;
    }

    const finalErrorResponse: ProviderResponse = lastResponse || {
      success: false,
      output: "",
      responseType: "FINAL_RESPONSE",
      usage: { promptTokens: 0, completionTokens: 0 },
      model: "unknown",
      providerName: primaryName.toUpperCase(),
      error: lastError || "All configured AI providers failed.",
    };

    return {
      response: finalErrorResponse,
      activeProvider: primaryName,
      usedFallback: false,
    };
  }

  /**
   * Retrieves live Telemetry and Health Status for Runtime Control page.
   */
  static async getStatus(): Promise<ProviderManagerStatus> {
    const sysConfig = await getSystemAiConfig();
    const dbProviders = await getProviderSettings();
    const allMetadata = getAllProviderMetadata();

    const primaryName = (sysConfig.default_provider || "gemini").toLowerCase();
    const priorityOrder = allMetadata
      .map((m) => {
        const db = dbProviders.find((p) => p.provider.toLowerCase() === m.providerId.toLowerCase());
        return { id: m.providerId.toLowerCase(), priority: db?.priority_order ?? m.priority };
      })
      .sort((a, b) => a.priority - b.priority)
      .map((x) => x.id);

    const fallbackProvider = priorityOrder.find((p) => p !== primaryName && (dbProviders.find((dp) => dp.provider === p)?.status === "CONNECTED")) || priorityOrder[1] || null;

    let totalRequests = 0;
    let totalSuccesses = 0;

    const providerStats: ProviderTelemetryEntry[] = allMetadata.map((meta) => {
      const pid = meta.providerId.toLowerCase();
      const dbInfo = dbProviders.find((dp) => dp.provider.toLowerCase() === pid);
      const store = getOrCreateTelemetry(pid);

      totalRequests += store.requestsServed;
      totalSuccesses += store.successes;

      const rate = store.requestsServed > 0
        ? Math.round((store.successes / store.requestsServed) * 100)
        : dbInfo?.status === "CONNECTED" ? 100 : 0;

      const avgLatencyMs = store.successes > 0 ? Math.round(store.totalLatencyMs / store.successes) : dbInfo?.avg_latency_ms || 0;
      const health: "HEALTHY" | "DEGRADED" | "DISCONNECTED" = dbInfo?.status === "CONNECTED" ? "HEALTHY" : store.failures > 0 ? "DEGRADED" : "DISCONNECTED";
      const healthScore = health === "HEALTHY" ? Math.min(100, Math.max(0, rate)) : health === "DEGRADED" ? 50 : 0;

      return {
        provider: pid,
        displayName: meta.displayName,
        requestsServed: store.requestsServed,
        successes: store.successes,
        failures: store.failures,
        promptTokens: store.promptTokens,
        completionTokens: store.completionTokens,
        lastFailureReason: store.lastFailureReason,
        lastFailureTime: store.lastFailureTime,
        health,
        successRate: rate,
        avgLatencyMs,
        healthScore,
      };
    });

    const overallSuccessRate = totalRequests > 0 ? Math.round((totalSuccesses / totalRequests) * 100) : 100;

    return {
      activeProvider: primaryName,
      fallbackProvider,
      autoFailover: sysConfig.enable_fallback,
      priorityOrder,
      providerStats,
      totalRequests,
      overallSuccessRate,
    };
  }

  // ==========================================
  // PART 10: COST OPTIMIZER FOUNDATION
  // ==========================================

  /**
   * Estimates cost in USD for a given provider and token counts based on ProviderMetadataRegistry pricing.
   */
  static estimateRequestCost(providerId: string, promptTokens: number, completionTokens: number): number {
    const meta = getProviderMetadata(providerId);
    if (!meta) return 0;
    if (meta.pricing.freeTier) return 0;

    const inputCost = (promptTokens / 1_000_000) * meta.pricing.estimatedInputCostPerMillion;
    const outputCost = (completionTokens / 1_000_000) * meta.pricing.estimatedOutputCostPerMillion;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Returns the cheapest provider matching required capability.
   */
  static calculateCheapestProvider(
    requiredCapability: keyof ProviderCapabilities = "chat",
    promptTokens: number = 1000,
    completionTokens: number = 1000
  ): { providerId: string; estimatedCost: number; displayName: string } {
    const allMetadata = getAllProviderMetadata();
    const capable = allMetadata.filter((m) => m.capabilities[requiredCapability] === true);

    let cheapest = capable[0] || allMetadata[0];
    let minCost = Infinity;

    for (const meta of capable) {
      const cost = this.estimateRequestCost(meta.providerId, promptTokens, completionTokens);
      if (cost < minCost) {
        minCost = cost;
        cheapest = meta;
      }
    }

    return {
      providerId: cheapest.providerId,
      displayName: cheapest.displayName,
      estimatedCost: minCost === Infinity ? 0 : minCost,
    };
  }
}
