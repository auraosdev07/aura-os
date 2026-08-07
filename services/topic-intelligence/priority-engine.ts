/**
 * services/topic-intelligence/priority-engine.ts
 *
 * Deterministic Priority Engine (Phase 4B.3).
 * Formula: Priority Score = Authority * Search Intent Weight * Community Demand * SERP Frequency
 * NO LLM, 100% deterministic mathematical scoring.
 */

export interface PriorityInput {
  authorityScore: number;
  intent: string;
  communityCount: number;
  serpCount: number;
}

export function calculatePriorityScore(input: PriorityInput): number {
  const { authorityScore, intent, communityCount, serpCount } = input;

  const intentWeightMap: Record<string, number> = {
    TRANSACTIONAL: 1.3,
    COMMERCIAL: 1.2,
    INFORMATIONAL: 1.0,
    NAVIGATIONAL: 0.9,
  };

  const intentWeight = intentWeightMap[intent.toUpperCase()] || 1.0;
  const communityDemandMultiplier = 1.0 + Math.min(0.5, communityCount * 0.05);
  const serpFrequencyMultiplier = 1.0 + Math.min(0.5, serpCount * 0.05);

  const score = authorityScore * intentWeight * communityDemandMultiplier * serpFrequencyMultiplier;

  return Number(Math.min(100, Math.max(1, score)).toFixed(1));
}
