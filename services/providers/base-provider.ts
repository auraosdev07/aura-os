/**
 * services/providers/base-provider.ts
 *
 * Aura OS AI Provider Interface (Abstract Base)
 * Every provider (OpenAI, Gemini, Claude, Ollama, OpenRouter)
 * must implement this interface. The Execution Engine never
 * references concrete providers — only this interface.
 */

export interface PromptInput {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderResponse {
  success: boolean;
  output: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  model: string;
  providerName: string;
  error?: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  contextWindow: number;
}

export interface ProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Abstract base that all providers must extend.
 */
export abstract class BaseProvider {
  abstract getProviderName(): string;
  abstract listAvailableModels(): ModelInfo[];
  abstract validateConfiguration(config: ProviderConfig): boolean;
  abstract executePrompt(input: PromptInput, config: ProviderConfig): Promise<ProviderResponse>;
}
