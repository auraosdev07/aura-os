/**
 * services/seo-intelligence/providers/duckduckgo-related.ts
 *
 * DuckDuckGo Related Search Provider (Phase 4B.2).
 * Collects related search expansion terms and query variations.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "../types";
import { SEO_INTEL_CONFIG } from "../config";
import { fetchWithRetry } from "@/services/crawler/fetch-with-retry";

export class DuckDuckGoRelatedProvider implements SEOIntelligenceProvider {
  id = "duckduckgo-related";
  name = "DuckDuckGo Related Searches";
  priority = 40;
  sourceType = "PUBLIC_SCRAPE" as const;
  trustScore = 0.88;

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async collectSignals(keyword: string): Promise<ProviderSignal[]> {
    const targetUrl = `${SEO_INTEL_CONFIG.DUCKDUCKGO_HTML_URL}${encodeURIComponent(keyword)}`;
    const timestamp = new Date().toISOString();

    const { response } = await fetchWithRetry(targetUrl, {
      headers: {
        "User-Agent": SEO_INTEL_CONFIG.USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const signals: ProviderSignal[] = [];

    // Extract related topics from DuckDuckGo HTML layout
    const relatedMatches = html.matchAll(/class="related-search[^"]*"[^>]*>([\s\S]*?)<\/a>/gi);
    for (const match of relatedMatches) {
      const text = match[1].replace(/<[^>]*>/g, "").trim();
      if (text && text.toLowerCase() !== keyword.toLowerCase()) {
        signals.push({
          type: "RELATED_SEARCH",
          text,
          metadata: { engine: "duckduckgo" },
          sourceName: this.name,
          sourceType: this.sourceType,
          sourceTrust: this.trustScore,
          sourceTimestamp: timestamp,
        });
      }
    }

    // Fallback: parse result snippet titles if related items are sparse
    if (signals.length === 0) {
      const snippetTitles = html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/gi);
      for (const m of snippetTitles) {
        const titleText = m[1].replace(/<[^>]*>/g, "").trim();
        if (titleText) {
          signals.push({
            type: "RELATED_SEARCH",
            text: titleText,
            metadata: { engine: "duckduckgo_fallback" },
            sourceName: this.name,
            sourceType: this.sourceType,
            sourceTrust: this.trustScore,
            sourceTimestamp: timestamp,
          });
        }
      }
    }

    return signals.slice(0, SEO_INTEL_CONFIG.MAX_RELATED_SEARCHES);
  }
}
