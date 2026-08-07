/**
 * services/product-seo/product-planner.ts
 *
 * Deterministic Product SEO Planner Engine.
 * Reuses Content Brief & Topic Graph signals to plan product-level SEO structure.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ProductSEOPlan } from "./types";

export function createProductSEOPlan(productId: string, brief: SEOContentBrief): ProductSEOPlan {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    productId,
    keyword: brief.keyword,
    targetCountry: brief.country,
    suggestedTitles: [
      `Original ${kwCap} — Certified Natural Gemstone Bracelet`,
      `Buy Original ${kwCap} Online (Lab Certified)`,
      `Natural ${kwCap}: Meaning, Benefits & Price`,
    ],
    benefitStructure: [
      `Emotional Healing & Calmness`,
      `Attracting Love & Positive Energy`,
      `Chakra Balancing & Stress Relief`,
      `100% Genuine Lab Certified Gemstone Beads`,
    ],
    careTopics: [
      `Water & Smoke Cleansing Instructions`,
      `Moonlight Energy Recharging Guide`,
      `Storage & Daily Wear Maintenance`,
    ],
    faqQuestions: brief.faqList.map((f) => f.question),
    internalLinkAnchors: brief.internalLinks.map((l) => l.anchorText),
  };
}
