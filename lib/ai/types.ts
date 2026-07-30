/**
 * lib/ai/types.ts
 *
 * Core TypeScript definitions for Aura OS AI Foundation.
 */

export type AIRole = "system" | "user" | "assistant" | "tool";

export interface AIMessage {
  role: AIRole;
  content: string;
  name?: string;
}

export interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateTextOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerateTextResult {
  text: string;
  usage?: UsageInfo;
  model: string;
  provider: string;
}

export interface GenerateJSONOptions {
  messages: AIMessage[];
  schema?: Record<string, unknown>;
  temperature?: number;
  model?: string;
}

export interface StreamTextOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  onChunk?: (chunk: string) => void;
}

export interface HealthCheckResult {
  ok: boolean;
  provider: string;
  message?: string;
  models?: string[];
}

export interface AIUsageLogPayload {
  ownerId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: "success" | "error";
}

/**
 * Unified AI Provider Contract
 */
export interface AIProvider {
  /**
   * Human-readable identifier for the provider (e.g. 'openai', 'gemini').
   */
  readonly name: string;

  /**
   * Generate complete text output from a list of messages.
   */
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;

  /**
   * Stream text output as a Web ReadableStream of UTF-8 chunks.
   */
  streamText(options: StreamTextOptions): Promise<ReadableStream<Uint8Array>>;

  /**
   * Generate structured JSON output conforming to a target schema/type.
   */
  generateJSON<T = unknown>(options: GenerateJSONOptions): Promise<T>;

  /**
   * Generate vector embeddings for input text (placeholder implementation).
   */
  embed(text: string | string[]): Promise<number[] | number[][]>;

  /**
   * List available models supported by this provider.
   */
  listModels(): Promise<string[]>;

  /**
   * Perform a lightweight connectivity & authorization test.
   */
  healthCheck(): Promise<HealthCheckResult>;
}
