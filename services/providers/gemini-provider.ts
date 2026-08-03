/**
 * services/providers/gemini-provider.ts
 *
 * Google Gemini Provider Placeholder
 * Implements BaseProvider interface with mock responses only.
 * No HTTP requests. No SDK. No API key required.
 */

import { BaseProvider } from "./base-provider";
import type { PromptInput, ProviderResponse, ModelInfo, ProviderConfig } from "./base-provider";

export class GeminiProvider extends BaseProvider {
  getProviderName(): string {
    return "GEMINI";
  }

  listAvailableModels(): ModelInfo[] {
    return [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", contextWindow: 1048576 },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", contextWindow: 2097152 },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", contextWindow: 1048576 },
    ];
  }

  validateConfiguration(config: ProviderConfig): boolean {
    return !!(config.provider && config.model);
  }

  async executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse> {
    // PLACEHOLDER: No real Gemini API call made.
    // Future implementation will call: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    return {
      success: true,
      output: "Mock execution completed.",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
      },
      model: config.model || "gemini-2.0-flash",
      providerName: this.getProviderName(),
    };
  }
}
