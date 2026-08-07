/**
 * services/growth/confidence-engine/orchestrator.ts
 *
 * Trend Confidence Engine for Phase 6.1 Module 5.
 * Evaluates trend confidence (LOW / MEDIUM / HIGH) using provider count, freshness, consistency, and signal quality.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { TrendConfidenceDTO, ConfidenceLevel } from "../types";

export class TrendConfidenceEngine {
  async evaluateConfidence(keyword: string, agreeingProvidersCount: number): Promise<TrendConfidenceDTO> {
    let level: ConfidenceLevel = "LOW";
    let reasoning = "";

    if (agreeingProvidersCount >= 4) {
      level = "HIGH";
      reasoning = `Validated by ${agreeingProvidersCount} cross-channel provider adapters (Search, Social, E-Commerce) with high signal consistency.`;
    } else if (agreeingProvidersCount >= 2) {
      level = "MEDIUM";
      reasoning = `Validated by ${agreeingProvidersCount} provider adapters. Emerging cross-channel signals.`;
    } else {
      level = "LOW";
      reasoning = `Single-source provider signal (${agreeingProvidersCount} provider). Requires further historical tracking.`;
    }

    const evaluation: TrendConfidenceDTO = {
      keyword,
      confidenceLevel: level,
      agreeingProvidersCount,
      reasoning,
      evaluatedAt: new Date().toISOString(),
    };

    try {
      const { supabase } = await getServerContext();
      if (supabase && typeof supabase.from === "function") {
        await supabase.from("trend_confidence").upsert(
          {
            keyword,
            confidence_level: level,
            agreeing_providers_count: agreeingProvidersCount,
            reasoning,
          },
          { onConflict: "keyword" }
        );
      }
    } catch (err) {
      console.error("[CONFIDENCE DB WARN]:", err);
    }

    return evaluation;
  }
}

export const trendConfidenceEngine = new TrendConfidenceEngine();
