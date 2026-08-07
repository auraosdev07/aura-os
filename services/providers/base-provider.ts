/**
 * services/providers/base-provider.ts
 *
 * Aura OS AI Provider Interface (Abstract Base)
 * Every provider (OpenAI, Gemini, Claude, Ollama, OpenRouter)
 * must implement this interface. Supports multi-turn execution loops
 * and tool-calling requests (CALL_TOOL vs FINAL_RESPONSE).
 */

export interface ToolCallRequest {
  toolId: string;
  input: Record<string, unknown>;
}

export interface ConversationTurn {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCall?: ToolCallRequest;
  toolResult?: Record<string, unknown> | string;
}

export interface PromptInput {
  systemPrompt: string;
  userPrompt: string;
  history?: ConversationTurn[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderResponse {
  success: boolean;
  output: string;
  responseType: "FINAL_RESPONSE" | "CALL_TOOL";
  toolCall?: ToolCallRequest;
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
