/**
 * services/content-strategy/brief-score.ts
 *
 * Deterministic Brief Score Engine (Phase 4B.4).
 * Score: 0-100 based on coverage metrics (entities, questions, modifiers, internal links, missing topics).
 * NO LLM, 100% deterministic formula.
 */

export interface BriefScoreInput {
  titleCount: number;
  headingCount: number;
  faqCount: number;
  entityCount: number;
  keywordCount: number;
  internalLinkCount: number;
  missingTopicCount: number;
}

export function calculateBriefScore(input: BriefScoreInput): number {
  const { titleCount, headingCount, faqCount, entityCount, keywordCount, internalLinkCount } = input;

  const titleScore = Math.min(15, titleCount * 2.5);
  const headingScore = Math.min(20, headingCount * 2.0);
  const faqScore = Math.min(20, faqCount * 2.5);
  const entityScore = Math.min(20, entityCount * 3.0);
  const keywordScore = Math.min(15, keywordCount * 0.5);
  const linkScore = Math.min(10, internalLinkCount * 2.0);

  const rawScore = titleScore + headingScore + faqScore + entityScore + keywordScore + linkScore;
  const finalScore = Math.min(100, Math.max(10, Number(rawScore.toFixed(1))));

  return finalScore;
}
