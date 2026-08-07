/**
 * services/providers/provider-registry.ts
 *
 * Provider Registry
 * Allows providers to be registered and retrieved by name dynamically.
 * Supports future additions (OpenRouter, Ollama, Mistral, etc.)
 * without touching orchestration logic.
 */

import { BaseProvider } from "./base-provider";
import { OpenAIProvider } from "./openai-provider";
import { GeminiProvider } from "./gemini-provider";
import { ClaudeProvider } from "./claude-provider";
import { GroqProvider } from "./groq-provider";
import { OpenRouterProvider } from "./openrouter-provider";
import { GitHubProvider } from "./github-provider";

// Internal singleton registry map
const registry = new Map<string, BaseProvider>();

// Register built-in providers
registry.set("GEMINI", new GeminiProvider());
registry.set("GROQ", new GroqProvider());
registry.set("OPENROUTER", new OpenRouterProvider());
registry.set("GITHUB", new GitHubProvider());
registry.set("OPENAI", new OpenAIProvider());
registry.set("CLAUDE", new ClaudeProvider());

/**
 * Registers a custom provider implementation into the registry.
 * Call this to plug in OpenRouter, Ollama, Mistral, etc.
 */
export function registerProvider(name: string, provider: BaseProvider): void {
  registry.set(name.toUpperCase(), provider);
}

/**
 * Retrieves a registered provider by name.
 * Returns undefined if not found.
 */
export function getRegisteredProvider(name: string): BaseProvider | undefined {
  return registry.get(name.toUpperCase());
}

/**
 * Lists all currently registered provider names.
 */
export function listRegisteredProviders(): string[] {
  return Array.from(registry.keys());
}
