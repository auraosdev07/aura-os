/**
 * services/growth/competitor-engine/orchestrator.ts
 *
 * Competitor Intelligence Architecture for Phase 6.0 Module 3.
 * Non-scraping data architecture supporting profiles, snapshots, launches, pricing, SEO metadata, and offers.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { CompetitorProfileDTO, CompetitorSnapshotDTO } from "../types";

export class CompetitorIntelligenceEngine {
  async getCompetitorProfiles(): Promise<CompetitorProfileDTO[]> {
    const defaultCompetitors: CompetitorProfileDTO[] = [
      {
        id: "comp_001",
        name: "Crystal Healing Co",
        websiteUrl: "https://example-crystalhealing.com",
        category: "Gems & Jewelry",
        pricingTier: "MID_TIER",
        seoAuthorityScore: 78.5,
        blogFrequencyPerWeek: 3.5,
      },
      {
        id: "comp_002",
        name: "Luxe Gemstone Studio",
        websiteUrl: "https://example-luxegems.com",
        category: "Gems & Jewelry",
        pricingTier: "LUXURY",
        seoAuthorityScore: 84.0,
        blogFrequencyPerWeek: 5.0,
      },
    ];

    try {
      const { supabase } = await getServerContext();
      if (supabase && typeof supabase.from === "function") {
        const { data: rows } = await supabase.from("competitor_profiles").select("*");
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            name: r.name,
            websiteUrl: r.website_url,
            category: r.category,
            pricingTier: r.pricing_tier,
            seoAuthorityScore: r.seo_authority_score,
            blogFrequencyPerWeek: r.blog_frequency_per_week,
          }));
        }
      }
    } catch (err) {
      console.error("[COMPETITOR DB WARN]:", err);
    }

    return defaultCompetitors;
  }

  async getRecentCompetitorSnapshots(): Promise<CompetitorSnapshotDTO[]> {
    return [
      {
        id: "snap_001",
        competitorId: "comp_001",
        newLaunches: [{ name: "Raw Pyrite Money Magnet Bracelet", category: "Wealth", price: 1499 }],
        pricingChanges: [{ sku: "SKU-RQ-01", oldPrice: 1299, newPrice: 1099 }],
        seoMetaChanges: [{ pageUrl: "/products/pyrite", field: "meta_title", newValue: "Buy Authentic Pyrite Bracelet Online" }],
        activeOffers: [{ offerTitle: "Festive Season 15% OFF", discountPercent: 15 }],
        capturedAt: new Date().toISOString(),
      },
    ];
  }
}

export const competitorIntelligenceEngine = new CompetitorIntelligenceEngine();
