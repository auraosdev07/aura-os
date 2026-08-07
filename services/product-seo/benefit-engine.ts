/**
 * services/product-seo/benefit-engine.ts
 *
 * Benefit & Care Guide Engine for Phase 5.1 Product SEO Engine.
 * Generates structured product benefits, healing uses, and care guides.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { ProductBenefitItem, ProductCareGuideItem } from "./types";

export function generateProductBenefitsAndCare(brief: SEOContentBrief): {
  benefits: ProductBenefitItem[];
  careGuides: ProductCareGuideItem[];
} {
  const kwCap = brief.keyword.replace(/\b\w/g, (c) => c.toUpperCase());

  const benefits: ProductBenefitItem[] = [
    {
      title: `Emotional Harmony & Healing`,
      description: `${kwCap} radiates gentle vibrational energy that soothes anxiety, dissolves emotional stress, and fosters deep personal peace.`,
      category: "BENEFIT",
      position: 1,
    },
    {
      title: `Aura Protection & Positivity`,
      description: `Acts as a natural energetic shield against negative environmental frequencies, elevating your personal aura and vitality.`,
      category: "HEALING_USE",
      position: 2,
    },
    {
      title: `Chakra Realignment`,
      description: `Specifically tuned to harmonize heart and throat chakras, facilitating authentic communication and emotional balance.`,
      category: "HEALING_USE",
      position: 3,
    },
    {
      title: `100% Genuine Lab Certified Beads`,
      description: `Strung with 8mm natural, unheated, dye-free mineral gemstone beads verified by an ISO-certified gemological laboratory.`,
      category: "SPECIFICATION",
      position: 4,
    },
  ];

  const careGuides: ProductCareGuideItem[] = [
    {
      title: `Water & Natural Smoke Cleansing`,
      instructions: `Rinse your ${kwCap} under lukewarm running water for 30 seconds or pass it through natural white sage smoke to reset energetic buildup.`,
      position: 1,
    },
    {
      title: `Moonlight Energy Recharging`,
      instructions: `Place the bracelet on a natural quartz cluster or window sill under full moonlight overnight once every month.`,
      position: 2,
    },
    {
      title: `Elastic Cord & Storage Maintenance`,
      instructions: `Avoid exposing the bracelet to harsh perfumes, chlorine, or chemical detergents. Store in the provided velvet pouch when not in use.`,
      position: 3,
    },
  ];

  return { benefits, careGuides };
}
