/**
 * lib/ai/client.ts
 *
 * Primary client facade for the AI Foundation layer.
 */

import { aiRegistry } from "./registry";
import type {
  AIProvider,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  StreamTextOptions,
  HealthCheckResult,
} from "./types";

/**
 * Get an AI provider instance (specified or active default).
 */
export function getAIProvider(providerName?: string): AIProvider {
  return aiRegistry.getProvider(providerName);
}

/**
 * Generate text output using the active or specified provider.
 */
export async function generateText(
  options: GenerateTextOptions,
  providerName?: string
): Promise<GenerateTextResult> {
  const provider = getAIProvider(providerName);
  return provider.generateText(options);
}

/**
 * Stream text output using the active or specified provider.
 */
export async function streamText(
  options: StreamTextOptions,
  providerName?: string
): Promise<ReadableStream<Uint8Array>> {
  const provider = getAIProvider(providerName);
  return provider.streamText(options);
}

/**
 * Generate structured JSON output using the active or specified provider.
 */
export async function generateJSON<T = unknown>(
  options: GenerateJSONOptions,
  providerName?: string
): Promise<T> {
  const provider = getAIProvider(providerName);
  return provider.generateJSON<T>(options);
}

/**
 * Generate vector embeddings using the active or specified provider.
 */
export async function embed(
  text: string | string[],
  providerName?: string
): Promise<number[] | number[][]> {
  const provider = getAIProvider(providerName);
  return provider.embed(text);
}

/**
 * Perform health check on active or specified provider.
 */
export async function healthCheck(providerName?: string): Promise<HealthCheckResult> {
  const provider = getAIProvider(providerName);
  return provider.healthCheck();
}
