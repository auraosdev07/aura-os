/**
 * services/search/search-provider-registry.ts
 *
 * Search Provider Registry (Phase 4A Step 8).
 * Central registry for registering and looking up SearchProvider implementations.
 */

import type { SearchProvider } from "./types";

const registry = new Map<string, SearchProvider>();

export function registerSearchProvider(provider: SearchProvider): void {
  registry.set(provider.name.toLowerCase(), provider);
}

export function getSearchProvider(name: string): SearchProvider | undefined {
  return registry.get(name.toLowerCase());
}

export function listSearchProviders(): SearchProvider[] {
  return Array.from(registry.values());
}
