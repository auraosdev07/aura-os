/**
 * services/providers/claude-provider.ts
 *
 * Anthropic Claude Provider Placeholder
 * Implements BaseProvider interface with mock responses only.
 * No HTTP requests. No SDK. No API key required.
 */

import { BaseProvider } from "./base-provider";
import type { PromptInput, ProviderResponse, ModelInfo, ProviderConfig } from "./base-provider";

export class ClaudeProvider extends BaseProvider {
  getProviderName(): string {
    return "CLAUDE";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "claude-opus-4-5", label: "Claude Opus 4.5", contextWindow: 200000 },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", contextWindow: 200000 },
      { id: "claude-haiku-3-5", label: "Claude Haiku 3.5", contextWindow: 200000 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    return !!(config.provider && config.model);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    // PLACEHOLDER: No real Anthropic API call made.
    // Future implementation will call: https://api.anthropic.com/v1/messages
    return {
      success: true,
      output: "Mock execution completed.",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
      },
      model: config.model || "claude-sonnet-4-5",
      providerName: this.getProviderName(),
    };
  }
}
