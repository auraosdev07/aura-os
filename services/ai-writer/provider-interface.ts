/**
 * services/ai-writer/provider-interface.ts
 *
 * Provider Interface for Phase 4B.5A Universal AI Writer Engine.
 * Abstrates model providers (OpenAI, Gemini, Anthropic, or Heuristic fallback).
 * Orchestrator NEVER directly invokes model-specific SDKs.
 */

export interface AIWriterGenerationOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AIWriterHealthStatus {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  providerId: string;
  latencyMs: number;
  message?: string;
}

export interface AIWriterProvider {
  id: string;
  name: string;
  supportsJson(): boolean;
  supportsImages(): boolean;
  supportsThinking(): boolean;
  health(): Promise<AIWriterHealthStatus>;
  generate(options: AIWriterGenerationOptions): Promise<string>;
  stream?(options: AIWriterGenerationOptions): AsyncIterable<string>;
}
