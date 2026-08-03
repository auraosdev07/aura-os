/**
 * services/providers/config-manager.ts
 *
 * Provider Configuration Manager
 * Manages AI provider config without hardcoding values.
 * Runtime configuration can be changed dynamically.
 * Future: load from database, env vars, or user settings.
 */

import type { ProviderConfig } from "./base-provider";

// Default provider configuration (no hardcoded API keys)
const DEFAULT_CONFIG: ProviderConfig = {
  provider: "OPENAI",
  model: "gpt-4o",
  apiKey: undefined,
  baseUrl: undefined,
  temperature: 0.7,
  maxTokens: 2048,
};

let activeConfig: ProviderConfig = { ...DEFAULT_CONFIG };

/**
 * Returns the currently active provider configuration.
 */
export function getProviderConfig(): ProviderConfig {
  return { ...activeConfig };
}

/**
 * Updates the active provider configuration (partial update supported).
 */
export function setProviderConfig(updates: Partial<ProviderConfig>): void {
  activeConfig = { ...activeConfig, ...updates };
}

/**
 * Resets provider configuration to defaults.
 */
export function resetProviderConfig(): void {
  activeConfig = { ...DEFAULT_CONFIG };
}

/**
 * Returns config formatted for a specific provider name (useful for per-run overrides).
 */
export function getConfigForProvider(providerName: string, model?: string): ProviderConfig {
  return {
    ...activeConfig,
    provider: providerName.toUpperCase(),
    model: model || activeConfig.model,
  };
}
