/**
 * types/provider.ts
 *
 * Single source of truth for AI Provider Management & Configuration in Aura OS.
 * Designed for dynamic, registry-driven, capability-aware provider orchestration.
 */

export type AiProviderName = string;

export interface ProviderCapabilities {
  chat: boolean;
  vision: boolean;
  imageGeneration: boolean;
  videoGeneration: boolean;
  embeddings: boolean;
  reranking: boolean;
  speechToText: boolean;
  textToSpeech: boolean;
  functionCalling: boolean;
  streaming: boolean;
  jsonMode: boolean;
  reasoning: boolean;
}

export interface ProviderPricing {
  freeTier: boolean;
  estimatedInputCostPerMillion: number;
  estimatedOutputCostPerMillion: number;
}

export interface ProviderSupportedModel {
  id: string;
  label: string;
  contextWindow?: number;
}

export interface ProviderMetadata {
  providerId: string;
  displayName: string;
  envVariableNames: string[];
  defaultModel: string;
  supportedModels: ProviderSupportedModel[];
  priority: number;
  enabledByDefault: boolean;
  capabilities: ProviderCapabilities;
  pricing: ProviderPricing;
  icon?: string;
  testEndpoint?: string;
}

export interface ProviderRuntimeStats {
  requestsServed: number;
  successes: number;
  failures: number;
  successRate: number;
  avgLatencyMs: number;
  lastUsedAt: string | null;
  lastError: string | null;
  healthScore: number; // 0 to 100
}

export interface AiProviderSettingRow {
  id: string;
  provider: AiProviderName;
  display_name: string;
  model: string;
  api_key: string | null;
  is_default: boolean;
  is_enabled: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  last_tested_at: string | null;
  priority_order?: number;
  avg_latency_ms?: number;
  last_used_at?: string | null;
  last_error?: string | null;
  health_score?: number;
  success_rate?: number;
  requests_served?: number;
  failure_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EnrichedProviderCard {
  metadata: ProviderMetadata;
  dbSetting: AiProviderSettingRow | null;
  isConfigured: boolean; // True if matching env key exists or DB api_key set
  effectiveModel: string;
  effectiveApiKeyMasked: string;
  isDefault: boolean;
  isEnabled: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  runtimeStats: ProviderRuntimeStats;
}

export interface SystemAiConfigRow {
  id: string;
  default_provider: AiProviderName;
  enable_fallback: boolean;
  updated_at: string;
}

export interface ProviderTelemetryStats {
  defaultProvider: AiProviderName;
  defaultModel: string;
  enableFallback: boolean;
  tokensUsedToday: number;
  estimatedCostUsd: number;
  health: "HEALTHY" | "DEGRADED" | "DISCONNECTED";
  providers: AiProviderSettingRow[];
}
