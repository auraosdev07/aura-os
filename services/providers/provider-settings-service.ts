"use server";

/**
 * services/providers/provider-settings-service.ts
 *
 * Backend service for managing AI provider configurations, default provider selection,
 * connection testing, priority reordering, and dynamic card enrichment.
 * Fully registry-driven: adding a provider metadata entry makes it available automatically.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { resolveProvider } from "./provider-factory";
import {
  getAllProviderMetadata,
  getProviderMetadata,
  isProviderEnvConfigured,
} from "./provider-metadata-registry";
import type {
  AiProviderSettingRow,
  SystemAiConfigRow,
  EnrichedProviderCard,
  ProviderTelemetryStats,
  ProviderRuntimeStats,
} from "@/types/provider";

/** Mask API Key for safe client rendering */
function maskApiKey(key: string | null): string {
  if (!key || key.trim().length === 0) return "Not set (reading env)";
  if (key.length <= 8) return "••••••••";
  return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
}

export async function getSystemAiConfig(): Promise<SystemAiConfigRow> {
  try {
    const { supabase } = await getServerContext();
    const { data } = await supabase
      .from("system_ai_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) return data as SystemAiConfigRow;
  } catch {
    // Fallback if table not ready
  }

  return {
    id: "default",
    default_provider: (process.env.DEFAULT_AI_PROVIDER as string) || "gemini",
    enable_fallback: true,
    updated_at: new Date().toISOString(),
  };
}

export async function getProviderSettings(): Promise<AiProviderSettingRow[]> {
  const metadataList = getAllProviderMetadata();
  let dbRows: AiProviderSettingRow[] = [];

  try {
    const { supabase } = await getServerContext();
    const { data, error } = await supabase
      .from("ai_provider_settings")
      .select("*")
      .order("priority_order", { ascending: true, nullsFirst: false });

    if (!error && data) {
      dbRows = data as AiProviderSettingRow[];
    }
  } catch {
    // Table not ready or error
  }

  // Merge DB rows with Registry Metadata so EVERY registered provider is represented
  return metadataList.map((meta, index) => {
    const dbRow = dbRows.find((r) => r.provider.toLowerCase() === meta.providerId.toLowerCase());
    const isEnvConfigured = isProviderEnvConfigured(meta);
    const envKey = meta.envVariableNames.map((e) => process.env[e]).find(Boolean) || null;

    if (dbRow) {
      return {
        ...dbRow,
        display_name: dbRow.display_name || meta.displayName,
        model: dbRow.model || meta.defaultModel,
        api_key: maskApiKey(dbRow.api_key || envKey),
        priority_order: dbRow.priority_order ?? meta.priority ?? index + 1,
        status: dbRow.status || (isEnvConfigured ? "CONNECTED" : "DISCONNECTED"),
      };
    }

    const statusVal: "CONNECTED" | "DISCONNECTED" | "ERROR" = isEnvConfigured ? "CONNECTED" : "DISCONNECTED";

    return {
      id: meta.providerId,
      provider: meta.providerId,
      display_name: meta.displayName,
      model: meta.defaultModel,
      api_key: maskApiKey(envKey),
      is_default: meta.providerId === "gemini",
      is_enabled: meta.enabledByDefault,
      status: statusVal,
      last_tested_at: null,
      priority_order: meta.priority ?? index + 1,
      avg_latency_ms: 0,
      last_used_at: null,
      last_error: null,
      health_score: 100,
      success_rate: 100,
      requests_served: 0,
      failure_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }).sort((a, b) => (a.priority_order ?? 100) - (b.priority_order ?? 100));
}

/**
 * Returns fully enriched provider cards dynamically from ProviderMetadataRegistry & DB.
 */
export async function getEnrichedProviderCards(): Promise<EnrichedProviderCard[]> {
  const metadataList = getAllProviderMetadata();
  const sysConfig = await getSystemAiConfig();
  const dbSettings = await getProviderSettings();

  return metadataList.map((meta) => {
    const dbSetting = dbSettings.find((s) => s.provider.toLowerCase() === meta.providerId.toLowerCase()) || null;
    const isConfigured = isProviderEnvConfigured(meta) || Boolean(dbSetting?.api_key && !dbSetting.api_key.includes("Not set"));
    const isDefault = (sysConfig.default_provider || "gemini").toLowerCase() === meta.providerId.toLowerCase();
    const isEnabled = dbSetting ? dbSetting.is_enabled : meta.enabledByDefault;
    const status = dbSetting ? dbSetting.status : isConfigured ? "CONNECTED" : "DISCONNECTED";

    const runtimeStats: ProviderRuntimeStats = {
      requestsServed: dbSetting?.requests_served ?? 0,
      successes: (dbSetting?.requests_served ?? 0) - (dbSetting?.failure_count ?? 0),
      failures: dbSetting?.failure_count ?? 0,
      successRate: dbSetting?.success_rate ?? (status === "CONNECTED" ? 100 : 0),
      avgLatencyMs: dbSetting?.avg_latency_ms ?? 0,
      lastUsedAt: dbSetting?.last_used_at ?? null,
      lastError: dbSetting?.last_error ?? null,
      healthScore: dbSetting?.health_score ?? (status === "CONNECTED" ? 100 : 0),
    };

    return {
      metadata: meta,
      dbSetting,
      isConfigured,
      effectiveModel: dbSetting?.model || meta.defaultModel,
      effectiveApiKeyMasked: dbSetting?.api_key || maskApiKey(meta.envVariableNames.map((e) => process.env[e]).find(Boolean) || null),
      isDefault,
      isEnabled,
      status,
      runtimeStats,
    };
  }).sort((a, b) => {
    const pA = a.dbSetting?.priority_order ?? a.metadata.priority;
    const pB = b.dbSetting?.priority_order ?? b.metadata.priority;
    return pA - pB;
  });
}

export async function setDefaultProvider(providerName: string): Promise<void> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();
  const lowerName = providerName.toLowerCase();

  // 1. Update system_ai_config
  const { data: config } = await supabase.from("system_ai_config").select("id").limit(1).maybeSingle();
  if (config) {
    await supabase.from("system_ai_config").update({ default_provider: lowerName, updated_at: now }).eq("id", config.id);
  } else {
    await supabase.from("system_ai_config").insert({ default_provider: lowerName, enable_fallback: true });
  }

  // 2. Update ai_provider_settings flags
  await supabase.from("ai_provider_settings").update({ is_default: false, updated_at: now }).neq("provider", lowerName);
  await supabase.from("ai_provider_settings").update({ is_default: true, updated_at: now }).eq("provider", lowerName);
}

export async function toggleEnableFallback(enable: boolean): Promise<void> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  const { data: config } = await supabase.from("system_ai_config").select("id").limit(1).maybeSingle();
  if (config) {
    await supabase.from("system_ai_config").update({ enable_fallback: enable, updated_at: now }).eq("id", config.id);
  } else {
    await supabase.from("system_ai_config").insert({ default_provider: "gemini", enable_fallback: enable });
  }
}

export async function updateProviderModel(
  providerName: string,
  model: string,
  apiKey?: string,
  priorityOrder?: number,
  isEnabled?: boolean
): Promise<void> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();
  const lowerName = providerName.toLowerCase();
  const meta = getProviderMetadata(lowerName);

  const updateData: Record<string, unknown> = {
    model,
    updated_at: now,
    display_name: meta?.displayName || providerName,
  };

  if (apiKey !== undefined && apiKey.trim().length > 0 && !apiKey.includes("••••")) {
    updateData.api_key = apiKey;
  }
  if (priorityOrder !== undefined) {
    updateData.priority_order = priorityOrder;
  }
  if (isEnabled !== undefined) {
    updateData.is_enabled = isEnabled;
  }

  const { data: existing } = await supabase
    .from("ai_provider_settings")
    .select("id")
    .eq("provider", lowerName)
    .maybeSingle();

  if (existing) {
    await supabase.from("ai_provider_settings").update(updateData).eq("provider", lowerName);
  } else {
    await supabase.from("ai_provider_settings").insert({
      provider: lowerName,
      display_name: meta?.displayName || providerName,
      model,
      is_default: false,
      is_enabled: isEnabled ?? true,
      status: "DISCONNECTED",
      priority_order: priorityOrder ?? meta?.priority ?? 100,
      ...updateData,
    });
  }
}

export async function reorderProvidersPriority(orderedProviderIds: string[]): Promise<void> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  for (let i = 0; i < orderedProviderIds.length; i++) {
    const providerId = orderedProviderIds[i].toLowerCase();
    const priority = i + 1;
    const meta = getProviderMetadata(providerId);

    const { data: existing } = await supabase
      .from("ai_provider_settings")
      .select("id")
      .eq("provider", providerId)
      .maybeSingle();

    if (existing) {
      await supabase.from("ai_provider_settings").update({ priority_order: priority, updated_at: now }).eq("provider", providerId);
    } else {
      await supabase.from("ai_provider_settings").insert({
        provider: providerId,
        display_name: meta?.displayName || providerId,
        model: meta?.defaultModel || "default",
        is_default: false,
        is_enabled: meta?.enabledByDefault ?? true,
        status: "DISCONNECTED",
        priority_order: priority,
      });
    }
  }
}

export async function testProviderConnection(providerName: string): Promise<{
  success: boolean;
  message: string;
}> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();
  const lowerName = providerName.toLowerCase();
  const meta = getProviderMetadata(lowerName);

  if (!meta) {
    return { success: false, message: `✗ Unknown provider: '${providerName}'` };
  }

  // Resolve API Key and Model
  let apiKey: string | undefined = meta.envVariableNames.map((e) => process.env[e]).find(Boolean);
  let model: string = meta.defaultModel;

  const { data: dbRow } = await supabase
    .from("ai_provider_settings")
    .select("api_key, model")
    .eq("provider", lowerName)
    .maybeSingle();

  if (dbRow?.api_key && !dbRow.api_key.includes("••••")) apiKey = dbRow.api_key;
  if (dbRow?.model) model = dbRow.model;

  if (!apiKey) {
    const errorMsg = `✗ Authentication Failed: ${meta.envVariableNames.join(" or ")} environment variable is missing.`;
    await updateProviderStatusInDb(supabase, lowerName, "ERROR", errorMsg, now);
    return { success: false, message: errorMsg };
  }

  const startTime = Date.now();
  try {
    const provider = resolveProvider(lowerName.toUpperCase());
    const res = await provider.executePrompt(
      {
        systemPrompt: "You are a health check system.",
        userPrompt: "Respond with OK.",
        model,
        maxTokens: 10,
      },
      { provider: lowerName.toUpperCase(), model, apiKey, temperature: 0.7, maxTokens: 10 }
    );

    const durationMs = Date.now() - startTime;

    if (res.success) {
      await updateProviderStatusInDb(supabase, lowerName, "CONNECTED", null, now, durationMs);
      return { success: true, message: `✓ Connected (${meta.displayName} - ${res.model || model}) in ${durationMs}ms` };
    } else {
      const errorMsg = `✗ Connection Failed: ${res.error || "Execution failed."}`;
      await updateProviderStatusInDb(supabase, lowerName, "ERROR", errorMsg, now, durationMs);
      return { success: false, message: errorMsg };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Connection error";
    await updateProviderStatusInDb(supabase, lowerName, "ERROR", errorMsg, now);
    return { success: false, message: `✗ Connection Error: ${errorMsg}` };
  }
}

async function updateProviderStatusInDb(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  providerId: string,
  status: "CONNECTED" | "DISCONNECTED" | "ERROR",
  lastError: string | null,
  now: string,
  durationMs: number = 0
) {
  const { data: existing } = await supabase
    .from("ai_provider_settings")
    .select("id")
    .eq("provider", providerId)
    .maybeSingle();

  const updateData: Record<string, unknown> = {
    status,
    last_tested_at: now,
    last_error: lastError,
    updated_at: now,
  };
  if (durationMs > 0) {
    updateData.avg_latency_ms = durationMs;
  }

  if (existing) {
    await supabase.from("ai_provider_settings").update(updateData).eq("provider", providerId);
  } else {
    const meta = getProviderMetadata(providerId);
    await supabase.from("ai_provider_settings").insert({
      provider: providerId,
      display_name: meta?.displayName || providerId,
      model: meta?.defaultModel || "default",
      is_default: false,
      is_enabled: meta?.enabledByDefault ?? true,
      priority_order: meta?.priority ?? 100,
      ...updateData,
    });
  }
}

export async function getProviderTelemetry(): Promise<ProviderTelemetryStats> {
  const sysConfig = await getSystemAiConfig();
  const providers = await getProviderSettings();

  const defaultProv = providers.find((p) => p.provider === sysConfig.default_provider) || providers[0];

  let tokensUsedToday = 0;
  try {
    const { supabase } = await getServerContext();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: runs } = await supabase
      .from("agent_runs")
      .select("output")
      .gte("started_at", todayStart.toISOString());

    if (runs) {
      for (const r of runs) {
        const out = r.output as { providerResponse?: { usage?: { promptTokens?: number; completionTokens?: number } } } | undefined;
        if (out?.providerResponse?.usage) {
          const u = out.providerResponse.usage;
          tokensUsedToday += (u.promptTokens || 0) + (u.completionTokens || 0);
        }
      }
    }
  } catch {
    // Ignore if table not available
  }

  const estimatedCostUsd = Number(((tokensUsedToday / 1000) * 0.00015).toFixed(4));

  const health: "HEALTHY" | "DEGRADED" | "DISCONNECTED" =
    defaultProv?.status === "CONNECTED"
      ? "HEALTHY"
      : providers.some((p) => p.status === "CONNECTED")
      ? "DEGRADED"
      : "DISCONNECTED";

  return {
    defaultProvider: sysConfig.default_provider,
    defaultModel: defaultProv?.model || "default",
    enableFallback: sysConfig.enable_fallback,
    tokensUsedToday,
    estimatedCostUsd,
    health,
    providers,
  };
}
