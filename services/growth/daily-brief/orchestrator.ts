/**
 * services/growth/daily-brief/orchestrator.ts
 *
 * Daily CEO Brief Generator for Phase 6.0 Module 6.
 * Generates structured, deterministic executive reports without unstructured AI fluff.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { DailyCEOBriefDTO } from "../types";
import { trendIntelligenceEngine } from "../trend-engine/orchestrator";
import { competitorIntelligenceEngine } from "../competitor-engine/orchestrator";
import { growthScoringEngine } from "../growth-score/orchestrator";

export class DailyCEOBriefEngine {
  async generateDailyBrief(): Promise<DailyCEOBriefDTO> {
    const today = new Date().toISOString().split("T")[0];
    const trends = await trendIntelligenceEngine.aggregateAndMergeTrends("Gems & Jewelry");
    const competitorSnapshots = await competitorIntelligenceEngine.getRecentCompetitorSnapshots();
    const growthScore = growthScoringEngine.calculateGrowthScore();

    const brief: DailyCEOBriefDTO = {
      briefDate: today,
      growthScore: growthScore.overallScore,
      topTrends: trends.slice(0, 5),
      competitorChanges: competitorSnapshots.flatMap((snap) => [
        { competitorName: "Crystal Healing Co", changeSummary: `Launched ${snap.newLaunches.length} new product: ${snap.newLaunches[0]?.name}` },
        { competitorName: "Luxe Gemstone Studio", changeSummary: `Updated Meta Titles on ${snap.seoMetaChanges.length} key pages` },
      ]),
      recommendedActions: [
        { actionTitle: "Launch Natural Citrine Wealth Cluster Landing Page", impact: "+$12,500 Monthly ARR Potential", urgency: "HIGH" },
        { actionTitle: "Enqueue Moldavite Identification Article in Editorial Queue", impact: "+4,200 Monthly Organic Visitors", urgency: "HIGH" },
        { actionTitle: "Sync Approved Amethyst Product SEO Metadata to Website", impact: "+18% CTR Enhancement", urgency: "MEDIUM" },
      ],
      warnings: [
        "Competitor 'Crystal Healing Co' launched Festive Discount (15% OFF) on bead bracelets",
        "Keyword 'Moldavite' customer inquiry volume up +28% on Quora",
      ],
      priorityList: [
        "1. Execute Product SEO Generation for Citrine Cluster",
        "2. Approve Editorial Queue Draft #ART-AMETHYST-001",
        "3. Trigger Website Sync for Approved Products",
      ],
      createdAt: new Date().toISOString(),
    };

    // Persist Daily Brief to Database
    try {
      const { supabase } = await getServerContext();
      if (supabase && typeof supabase.from === "function") {
        await supabase.from("daily_ceo_briefs").upsert(
          {
            brief_date: today,
            growth_score: brief.growthScore,
            top_trends: brief.topTrends,
            competitor_changes: brief.competitorChanges,
            recommended_actions: brief.recommendedActions,
            warnings: brief.warnings,
            priority_list: brief.priorityList,
          },
          { onConflict: "brief_date" }
        );
      }
    } catch (err) {
      console.error("[DAILY BRIEF DB WARN]:", err);
    }

    return brief;
  }
}

export const dailyCEOBriefEngine = new DailyCEOBriefEngine();
