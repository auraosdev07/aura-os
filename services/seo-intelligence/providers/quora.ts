/**
 * services/seo-intelligence/providers/quora.ts
 *
 * Quora Provider (Phase 4B.2 — Best Effort).
 * Searches site:quora.com via DuckDuckGo to extract user question threads.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "../types";
import { SEO_INTEL_CONFIG } from "../config";
import { fetchWithRetry } from "@/services/crawler/fetch-with-retry";

export class QuoraProvider implements SEOIntelligenceProvider {
  id = "quora-community";
  name = "Quora Community Search (Best Effort)";
  priority = 50;
  sourceType = "COMMUNITY_SERP" as const;
  trustScore = 0.80;

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async collectSignals(keyword: string): Promise<ProviderSignal[]> {
    const query = `site:quora.com ${keyword}`;
    const targetUrl = `${SEO_INTEL_CONFIG.DUCKDUCKGO_HTML_URL}${encodeURIComponent(query)}`;
    const timestamp = new Date().toISOString();

    try {
      const { response } = await fetchWithRetry(targetUrl, {
        headers: {
          "User-Agent": SEO_INTEL_CONFIG.USER_AGENT,
        },
      });

      if (!response.ok) return [];

      const html = await response.text();
      const signals: ProviderSignal[] = [];

      const matches = html.matchAll(/class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);
      for (const m of matches) {
        const rawUrl = m[1];
        const rawTitle = m[2].replace(/<[^>]*>/g, "").replace(/ - Quora$/i, "").trim();

        if (rawTitle && rawTitle.length > 5) {
          signals.push({
            type: "QUESTION",
            text: rawTitle,
            url: rawUrl,
            metadata: { platform: "Quora" },
            sourceName: this.name,
            sourceType: this.sourceType,
            sourceTrust: this.trustScore,
            sourceTimestamp: timestamp,
          });
        }
      }

      return signals.slice(0, 10);
    } catch {
      // Best effort provider — return empty array on failure without throwing
      return [];
    }
  }
}
