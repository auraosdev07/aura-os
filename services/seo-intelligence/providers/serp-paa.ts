/**
 * services/seo-intelligence/providers/serp-paa.ts
 *
 * Google SERP & People Also Ask (PAA) Provider (Phase 4B.2).
 * Parses organic SERP result titles/URLs and PAA questions from public HTML.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "../types";
import { SEO_INTEL_CONFIG } from "../config";
import { fetchWithRetry } from "@/services/crawler/fetch-with-retry";

export class GoogleSerpPaaProvider implements SEOIntelligenceProvider {
  id = "google-serp-paa";
  name = "Google SERP & PAA Parser";
  priority = 20;
  sourceType = "PUBLIC_SCRAPE" as const;
  trustScore = 0.90;

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async collectSignals(keyword: string, country: string): Promise<ProviderSignal[]> {
    const targetUrl = `${SEO_INTEL_CONFIG.GOOGLE_SERP_URL}${encodeURIComponent(keyword)}&gl=${country.toLowerCase()}`;
    const timestamp = new Date().toISOString();

    const { response } = await fetchWithRetry(targetUrl, {
      headers: {
        "User-Agent": SEO_INTEL_CONFIG.USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 403) {
        throw new Error(`Google SERP blocked request with HTTP ${response.status}`);
      }
      throw new Error(`Google SERP returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const signals: ProviderSignal[] = [];

    // 1. Parse PAA Questions (Regex extraction from HTML string to avoid heavy DOM overhead)
    const paaMatches = html.matchAll(/class="[^"]*related-question-pair[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
    for (const match of paaMatches) {
      const block = match[1];
      const qTextMatch = block.match(/data-q="([^"]+)"/) || block.match(/>([^<]+\?)</);
      if (qTextMatch && qTextMatch[1]) {
        const question = qTextMatch[1].trim();
        if (question.length > 5) {
          signals.push({
            type: "QUESTION",
            text: question,
            metadata: { type: "People Also Ask" },
            sourceName: this.name,
            sourceType: this.sourceType,
            sourceTrust: this.trustScore,
            sourceTimestamp: timestamp,
          });
        }
      }
    }

    // Fallback PAA regex pattern for modern Google SERP layout
    if (signals.filter((s) => s.type === "QUESTION").length === 0) {
      const altPaaMatches = html.matchAll(/aria-label="([^"]+\?)"/gi);
      for (const m of altPaaMatches) {
        if (m[1] && m[1].length > 10) {
          signals.push({
            type: "QUESTION",
            text: m[1].trim(),
            metadata: { type: "People Also Ask" },
            sourceName: this.name,
            sourceType: this.sourceType,
            sourceTrust: this.trustScore,
            sourceTimestamp: timestamp,
          });
        }
      }
    }

    // 2. Parse Organic SERP Items
    const titleUrlMatches = html.matchAll(/<a href="\/url\?q=([^"&]+)[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi);
    let rank = 1;
    for (const match of titleUrlMatches) {
      if (rank > SEO_INTEL_CONFIG.MAX_SERP_ITEMS) break;
      const rawUrl = decodeURIComponent(match[1]);
      const rawTitle = match[2].replace(/<[^>]*>/g, "").trim();

      if (rawTitle && rawUrl.startsWith("http")) {
        signals.push({
          type: "SERP_ITEM",
          text: rawTitle,
          url: rawUrl,
          metadata: { rank, hasSchema: html.includes("application/ld+json") },
          sourceName: this.name,
          sourceType: this.sourceType,
          sourceTrust: this.trustScore,
          sourceTimestamp: timestamp,
        });
        rank++;
      }
    }

    return signals;
  }
}
