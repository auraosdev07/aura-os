/**
 * services/growth/trend-engine/orchestrator.ts
 *
 * Master Trend Intelligence Orchestrator for Phase 6.0 Module 2.
 * Aggregates, merges, scores, and persists trend snapshots from pluggable provider adapters.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { NormalizedTrendDTO } from "../types";
import {
  GoogleTrendsAdapter,
  GoogleAutocompleteAdapter,
  PinterestTrendsAdapter,
  RedditTrendsAdapter,
  YouTubeTrendsAdapter,
  InstagramTrendsAdapter,
  AmazonTrendsAdapter,
  EtsyTrendsAdapter,
  QuoraTrendsAdapter,
} from "../provider-adapters/trend-adapters";

export class TrendIntelligenceEngine {
  private adapters = [
    new GoogleTrendsAdapter(),
    new GoogleAutocompleteAdapter(),
    new PinterestTrendsAdapter(),
    new RedditTrendsAdapter(),
    new YouTubeTrendsAdapter(),
    new InstagramTrendsAdapter(),
    new AmazonTrendsAdapter(),
    new EtsyTrendsAdapter(),
    new QuoraTrendsAdapter(),
  ];

  async aggregateAndMergeTrends(category = "Gems & Jewelry"): Promise<NormalizedTrendDTO[]> {
    const allTrends: NormalizedTrendDTO[] = [];

    for (const adapter of this.adapters) {
      try {
        const trends = await adapter.fetchTrends(category);
        allTrends.push(...trends);
      } catch (err) {
        console.error(`[TREND ADAPTER ERROR]: Provider ${adapter.providerId} failed:`, err);
      }
    }

    // Merge & Deduplicate Trends across providers
    const mergedMap = new Map<string, NormalizedTrendDTO>();

    for (const trend of allTrends) {
      const key = trend.keyword.toLowerCase().trim();
      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...trend });
      } else {
        const existing = mergedMap.get(key)!;
        existing.searchVolumeIndex = Math.max(existing.searchVolumeIndex, trend.searchVolumeIndex);
        existing.growthVelocity = Math.round(((existing.growthVelocity + trend.growthVelocity) / 2) * 10) / 10;
      }
    }

    const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.growthVelocity - a.growthVelocity);

    // Persist to Supabase Database
    try {
      const { supabase } = await getServerContext();
      if (supabase && typeof supabase.from === "function") {
        for (const t of mergedList.slice(0, 15)) {
          await supabase.from("trend_snapshots").insert({
            provider_id: t.providerId,
            keyword: t.keyword,
            category: t.category,
            search_volume_index: t.searchVolumeIndex,
            growth_velocity: t.growthVelocity,
            sentiment_score: t.sentimentScore,
            raw_payload: t.rawPayload || {},
          });
        }
      }
    } catch (err) {
      console.error("[TREND DB PERSIST WARN]:", err);
    }

    return mergedList;
  }
}

export const trendIntelligenceEngine = new TrendIntelligenceEngine();
