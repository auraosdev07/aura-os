/**
 * services/topic-intelligence/content-gap-engine.ts
 *
 * Deterministic Content Gap Engine (Phase 4B.3).
 * Identifies missing high-value target keywords for a topic cluster.
 * STRICT RULE: Only suggests if modifier exists OR community asks it OR autocomplete suggests it.
 * NEVER invents or hallucinates. 100% deterministic logic.
 */

import type { ContentGap } from "./types";

const ESSENTIAL_TEMPLATES = [
  { suffix: "meaning", reason: "Informational foundational intent missing" },
  { suffix: "benefits", reason: "High-volume benefit intent missing" },
  { suffix: "price", reason: "Transactional pricing intent missing" },
  { suffix: "uses", reason: "Usage and application intent missing" },
  { suffix: "cleansing", reason: "Maintenance and care intent missing" },
  { suffix: "care", reason: "Longevity and product care intent missing" },
  { suffix: "original", reason: "Authenticity verification intent missing" },
];

export function findContentGaps(
  clusterId: string,
  primaryKeyword: string,
  existingKeywords: string[],
  availableSuggestions: string[],
  communityQuestions: string[]
): ContentGap[] {
  const existingSet = new Set(existingKeywords.map((k) => k.toLowerCase().trim()));
  const allCollectedTexts = [...availableSuggestions, ...communityQuestions].map((s) => s.toLowerCase().trim());
  const gaps: ContentGap[] = [];

  for (const tpl of ESSENTIAL_TEMPLATES) {
    const candidate = `${primaryKeyword.toLowerCase().trim()} ${tpl.suffix}`;

    if (!existingSet.has(candidate)) {
      // Check strict rule: Must exist in collected suggestions or community questions
      const isCollected = allCollectedTexts.some((txt) => txt.includes(candidate) || txt.includes(tpl.suffix));

      if (isCollected) {
        const isQuestion = tpl.suffix === "meaning" || tpl.suffix === "uses";
        const priority = tpl.suffix === "price" || tpl.suffix === "original" ? "HIGH" : isQuestion ? "MEDIUM" : "LOW";
        const score = priority === "HIGH" ? 90 : priority === "MEDIUM" ? 75 : 60;

        gaps.push({
          clusterId,
          keyword: candidate,
          priority,
          reason: tpl.reason,
          score,
        });
      }
    }
  }

  return gaps;
}
