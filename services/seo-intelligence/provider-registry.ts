/**
 * services/seo-intelligence/provider-registry.ts
 *
 * Provider Registry for Phase 4B.2.
 * Decouples the orchestrator from individual provider implementations.
 * Providers self-register. The orchestrator calls `providerRegistry.runAll()`.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "./types";
import { providerHealthMonitor } from "./provider-health";

class ProviderRegistry {
  private providers: Map<string, SEOIntelligenceProvider> = new Map();

  /** Register a provider */
  register(provider: SEOIntelligenceProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[PROVIDER REGISTRY] Overwriting registered provider: ${provider.id}`);
    }
    this.providers.set(provider.id, provider);
  }

  /** Unregister a provider */
  unregister(providerId: string): boolean {
    return this.providers.delete(providerId);
  }

  /** Get all registered providers sorted by priority */
  getProviders(): SEOIntelligenceProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  /** Run all enabled and healthy providers concurrently via Promise.allSettled */
  async runAll(
    keyword: string,
    country: string
  ): Promise<{ signals: ProviderSignal[]; activeProviders: string[] }> {
    const sorted = this.getProviders();
    const activeProviders: string[] = [];
    const executionPromises: Promise<{ providerId: string; signals: ProviderSignal[] }>[] = [];

    for (const provider of sorted) {
      const isEnabled = await provider.isEnabled();
      const isHealthy = await providerHealthMonitor.isProviderHealthy(provider.id);

      if (isEnabled && isHealthy) {
        activeProviders.push(provider.id);
        executionPromises.push(
          (async () => {
            const start = Date.now();
            try {
              console.log(`[PROVIDER START] ${provider.id} (${provider.name}) for keyword "${keyword}"`);
              const signals = await provider.collectSignals(keyword, country);
              const duration = Date.now() - start;
              await providerHealthMonitor.recordRun(provider.id, provider.name, duration, null);
              console.log(`[PROVIDER FINISH] ${provider.id}: collected ${signals.length} signals in ${duration}ms`);
              return { providerId: provider.id, signals };
            } catch (err: any) {
              const duration = Date.now() - start;
              await providerHealthMonitor.recordRun(provider.id, provider.name, duration, err);
              console.error(`[PROVIDER ERROR] ${provider.id} failed after ${duration}ms:`, err.message);
              return { providerId: provider.id, signals: [] };
            }
          })()
        );
      } else {
        console.log(`[PROVIDER SKIP] ${provider.id} (enabled: ${isEnabled}, healthy: ${isHealthy})`);
      }
    }

    const results = await Promise.allSettled(executionPromises);
    const allSignals: ProviderSignal[] = [];

    for (const res of results) {
      if (res.status === "fulfilled") {
        allSignals.push(...res.value.signals);
      }
    }

    return { signals: allSignals, activeProviders };
  }
}

export const providerRegistry = new ProviderRegistry();
