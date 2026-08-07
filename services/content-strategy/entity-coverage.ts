/**
 * services/content-strategy/entity-coverage.ts
 *
 * Deterministic Entity Coverage Engine (Phase 4B.4).
 * Categorizes entities into Primary, Secondary, Missing, Required Mentions, and Target Density.
 * NO LLM, 100% rule-based classification.
 */

import type { EntityCoverage } from "./types";

export function analyzeEntityCoverage(
  extractedEntities: Array<{ text: string; type: string; confidence: number }>,
  keyword: string
): EntityCoverage {
  const primaryEntities: string[] = [];
  const secondaryEntities: string[] = [];
  const requiredMentions: string[] = [];

  for (const ent of extractedEntities) {
    if (ent.type === "material" || ent.type === "product") {
      primaryEntities.push(ent.text);
      requiredMentions.push(ent.text);
    } else {
      secondaryEntities.push(ent.text);
    }
  }

  // Mandatory baseline mentions based on keyword
  const kwTokens = keyword.toLowerCase().split(" ");
  for (const tok of kwTokens) {
    if (tok.length > 3 && !requiredMentions.includes(tok)) {
      requiredMentions.push(tok);
    }
  }

  const missingEntities: string[] = [
    "lab certification",
    "bead size (8mm)",
    "natural gemstone origin",
  ].filter((m) => !primaryEntities.includes(m) && !secondaryEntities.includes(m));

  return {
    primaryEntities: Array.from(new Set(primaryEntities)),
    secondaryEntities: Array.from(new Set(secondaryEntities)),
    missingEntities,
    requiredMentions: Array.from(new Set(requiredMentions)),
    entityDensityTarget: "1.5% - 2.5%",
  };
}
