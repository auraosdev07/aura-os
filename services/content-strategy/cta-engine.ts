/**
 * services/content-strategy/cta-engine.ts
 *
 * Deterministic Call-To-Action (CTA) Generator Engine (Phase 4B.4).
 * Rules:
 *   Informational -> Soft CTA (Newsletter / Guide Download)
 *   Commercial    -> Product Recommendation (Featured Showcase)
 *   Transactional -> Buy CTA (Direct Store Add to Cart)
 * NO LLM, 100% rule-based CTA recommendations.
 */

import type { CTARecommendation } from "./types";

export function generateCTARecommendation(intent: string, keyword: string): CTARecommendation {
  const kwCap = keyword.replace(/\b\w/g, (l) => l.toUpperCase());
  const lowerIntent = intent.toLowerCase();

  if (lowerIntent === "transactional" || keyword.toLowerCase().includes("buy") || keyword.toLowerCase().includes("price")) {
    return {
      ctaType: "Buy CTA",
      heading: `Ready to Experience Genuine ${kwCap}?`,
      description: `Shop certified 100% natural ${kwCap} with free nationwide shipping and authenticity guarantee.`,
      buttonText: `Buy ${kwCap} Now`,
    };
  }

  if (lowerIntent === "commercial" || keyword.toLowerCase().includes("best") || keyword.toLowerCase().includes("review")) {
    return {
      ctaType: "Product Recommendation",
      heading: `Explore Certified ${kwCap} Collection`,
      description: `Compare our top-rated lab-tested ${kwCap} options crafted for spiritual healing and daily wear.`,
      buttonText: `View Recommended ${kwCap} Options`,
    };
  }

  return {
    ctaType: "Soft CTA",
    heading: `Want to Learn More About Crystal Healing?`,
    description: `Subscribe to our newsletter for free guides on cleansing, wearing, and maximizing energy from ${kwCap}.`,
    buttonText: `Download Free Crystal Guide`,
  };
}
