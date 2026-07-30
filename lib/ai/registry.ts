/**
 * lib/ai/registry.ts
 *
 * Dynamic AI Provider Registry for Aura OS.
 * Supports registerProvider(), getProvider(), and hasProvider().
 */

import type { AIProvider } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export class AIRegistry {
  private static instance: AIRegistry;
  private providers = new Map<string, AIProvider>();

  private constructor() {
    // Register built-in providers
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
  }

  public static getInstance(): AIRegistry {
    if (!AIRegistry.instance) {
      AIRegistry.instance = new AIRegistry();
    }
    return AIRegistry.instance;
  }

  /**
   * Register a new AI Provider implementation dynamically.
   */
  public registerProvider(provider: AIProvider): void {
    if (!provider || !provider.name) {
      throw new Error("Cannot register invalid AIProvider.");
    }
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  /**
   * Check whether a provider with the given name is registered.
   */
  public hasProvider(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Resolve active provider name following configuration priority:
   * 1. DB settings (future-ready extension point)
   * 2. Environment variables (process.env.AI_PROVIDER)
   * 3. Fallback discovery (Gemini -> OpenAI)
   */
  public getActiveProviderName(): string {
    // 1. Future DB settings check (hook)
    // if (dbSettingProvider) return dbSettingProvider;

    // 2. Environment variable configuration
    if (process.env.AI_PROVIDER) {
      return process.env.AI_PROVIDER.toLowerCase();
    }

    // 3. Fallback discovery based on available keys
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return "gemini";
    }
    if (process.env.OPENAI_API_KEY) {
      return "openai";
    }

    // Default to gemini
    return "gemini";
  }

  /**
   * Retrieve a provider by name or resolve the active provider.
   */
  public getProvider(name?: string): AIProvider {
    const targetName = (name || this.getActiveProviderName()).toLowerCase();
    const provider = this.providers.get(targetName);

    if (!provider) {
      const available = Array.from(this.providers.keys()).join(", ");
      throw new Error(
        `AI Provider '${targetName}' is not registered. Available providers: [${available}]`
      );
    }

    return provider;
  }

  /**
   * List names of all registered providers.
   */
  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const aiRegistry = AIRegistry.getInstance();
