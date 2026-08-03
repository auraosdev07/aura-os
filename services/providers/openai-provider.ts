/**
 * services/providers/openai-provider.ts
 *
 * OpenAI Provider Placeholder
 * Implements BaseProvider interface with mock responses only.
 * No HTTP requests. No SDK. No API key required.
 */

import { BaseProvider } from "./base-provider";
import type { PromptInput, ProviderResponse, ModelInfo, ProviderConfig } from "./base-provider";

export class OpenAIProvider extends BaseProvider {
  getProviderName(): string {
    return "OPENAI";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "gpt-4o", label: "GPT-4o", contextWindow: 128000 },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", contextWindow: 128000 },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", contextWindow: 16385 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    return !!(config.provider && config.model);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    // PLACEHOLDER: No real OpenAI API call made.
    // Future implementation will call: https://api.openai.com/v1/chat/completions
    return {
      success: true,
      output: "Mock execution completed.",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
      },
      model: config.model || "gpt-4o",
      providerName: this.getProviderName(),
    };
  }
}
