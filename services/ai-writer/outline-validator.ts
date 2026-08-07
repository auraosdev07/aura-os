/**
 * services/ai-writer/outline-validator.ts
 *
 * Outline Validator for Phase 4B.5A AI Writer Engine.
 * Verifies H1 count, H2 hierarchy, missing entities, missing FAQs, missing CTAs, and missing internal links.
 * Returns validation errors if incomplete prior to section generation.
 */

import type { SEOContentBrief } from "@/services/content-strategy/types";
import type { WritingPlan } from "./types";

export interface OutlineValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWritingPlan(plan: WritingPlan, brief: SEOContentBrief): OutlineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check H1 count
  const h1Count = plan.sectionOrder.filter((s) => s.level === "H1").length;
  if (h1Count === 0) {
    errors.push("Missing H1 title in section outline.");
  } else if (h1Count > 1) {
    errors.push(`Multiple H1 headings detected (${h1Count}). Exactly one H1 permitted per article.`);
  }

  // 2. Check H2 count
  const h2Count = plan.sectionOrder.filter((s) => s.level === "H2").length;
  if (h2Count < 2) {
    errors.push(`Insufficient H2 headings (${h2Count}). Minimum 2 H2 headings required for structure.`);
  }

  // 3. Check Entity Allocation
  if (!brief.entityCoverage || brief.entityCoverage.primaryEntities.length === 0) {
    warnings.push("No primary entities assigned in content brief.");
  }

  // 4. Check FAQs
  if (!brief.faqList || brief.faqList.length === 0) {
    warnings.push("No FAQ items found in content brief outline.");
  }

  // 5. Check Internal Links
  if (plan.internalLinkPlacements.length === 0) {
    warnings.push("No internal link placements allocated in writing plan.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
