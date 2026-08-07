/**
 * services/content-strategy/product-placement-engine.ts
 *
 * Deterministic Product Placement Engine (Phase 4B.4).
 * Places product showcases at key psychological conversion points:
 * After Benefits, After Buying Guide, Before FAQ, Conclusion.
 * NO LLM, 100% deterministic rules.
 */

import type { ProductPlacement } from "./types";

export function generateProductPlacements(keyword: string): ProductPlacement[] {
  const kwCap = keyword.replace(/\b\w/g, (l) => l.toUpperCase());

  return [
    {
      placementLocation: "After Benefits",
      description: `Insert a 2-card product banner highlighting certified ${kwCap} immediately after detailing healing benefits.`,
      suggestedProductTypes: [`8mm Genuine ${kwCap}`, `Raw Crystal ${kwCap}`],
    },
    {
      placementLocation: "After Buying Guide",
      description: `Feature a comparative product table with lab certification badges following the authenticity inspection checklist.`,
      suggestedProductTypes: [`Certified Premium ${kwCap}`, `Elastic Stretch ${kwCap}`],
    },
    {
      placementLocation: "Before FAQ",
      description: `Display a limited-time promotional banner offering bundle discounts for crystal sets.`,
      suggestedProductTypes: [`${kwCap} + Clear Quartz Set`, `7 Chakra Energy Set`],
    },
    {
      placementLocation: "Conclusion",
      description: `Primary purchase CTA box with guarantee badges, star ratings, and instant add-to-cart link.`,
      suggestedProductTypes: [`Best-Seller ${kwCap}`],
    },
  ];
}
