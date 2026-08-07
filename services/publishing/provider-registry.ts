/**
 * services/publishing/provider-registry.ts
 *
 * Provider Registry for Phase 5.0 Publishing Architecture.
 */

import type { PublishingProvider } from "./provider-interface";
import { MarkdownExportProvider } from "./providers/markdown-export";

class PublishingProviderRegistry {
  private providers: Map<string, PublishingProvider> = new Map();

  constructor() {
    this.register(new MarkdownExportProvider());
  }

  register(provider: PublishingProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): PublishingProvider {
    return this.providers.get(id) || this.providers.get("markdown-export")!;
  }

  getAllProviders(): PublishingProvider[] {
    return Array.from(this.providers.values());
  }
}

export const publishingProviderRegistry = new PublishingProviderRegistry();
