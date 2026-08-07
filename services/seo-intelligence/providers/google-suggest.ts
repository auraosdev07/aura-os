/**
 * services/seo-intelligence/providers/google-suggest.ts
 *
 * Google Autocomplete Suggestion Provider (Phase 4B.2).
 * Conforms strictly to SEOIntelligenceProvider interface.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "../types";
import { SEO_INTEL_CONFIG } from "../config";
import { fetchWithRetry } from "@/services/crawler/fetch-with-retry";

export class GoogleSuggestProvider implements SEOIntelligenceProvider {
  id = "google-suggest";
  name = "Google Suggest API";
  priority = 10;
  sourceType = "PUBLIC_API" as const;
  trustScore = 0.95;

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async collectSignals(keyword: string, country: string): Promise<ProviderSignal[]> {
    const targetUrl = `${SEO_INTEL_CONFIG.GOOGLE_SUGGEST_URL}${encodeURIComponent(keyword)}&hl=${country.toLowerCase()}`;
    const timestamp = new Date().toISOString();

    const { response } = await fetchWithRetry(targetUrl, {
      headers: {
        "User-Agent": SEO_INTEL_CONFIG.USER_AGENT,
        "Accept": "application/json, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Suggest API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    // Firefox client response format: [query, [suggestions...]]
    if (!Array.isArray(data) || !Array.isArray(data[1])) {
      return [];
    }

    const rawSuggestions: string[] = data[1];
    
    return rawSuggestions.slice(0, SEO_INTEL_CONFIG.MAX_SUGGESTIONS).map((sugg) => ({
      type: "SUGGESTION",
      text: sugg.trim(),
      metadata: { originalQuery: keyword, country },
      sourceName: this.name,
      sourceType: this.sourceType,
      sourceTrust: this.trustScore,
      sourceTimestamp: timestamp,
    }));
  }
}
