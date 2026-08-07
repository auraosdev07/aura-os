/**
 * services/ai-writer/provider-registry.ts
 *
 * Provider Registry for Phase 4B.5A AI Writer.
 * Manages model providers and returns active provider instance.
 */

import type { AIWriterProvider } from "./provider-interface";
import { HeuristicFallbackProvider } from "./providers/heuristic-fallback";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";

class AIWriterProviderRegistry {
  private providers: Map<string, AIWriterProvider> = new Map();
  private fallbackProvider: AIWriterProvider = new HeuristicFallbackProvider();

  constructor() {
    this.register(this.fallbackProvider);
    this.register(new OpenAIProvider());
    this.register(new GeminiProvider());
    this.register(new AnthropicProvider());
  }

  register(provider: AIWriterProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId?: string): AIWriterProvider {
    if (providerId && this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }
    return this.fallbackProvider;
  }

  getAllProviders(): AIWriterProvider[] {
    return Array.from(this.providers.values());
  }
}

export const aiWriterProviderRegistry = new AIWriterProviderRegistry();
