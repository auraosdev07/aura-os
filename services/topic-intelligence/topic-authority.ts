/**
 * services/topic-intelligence/topic-authority.ts
 *
 * Deterministic Topic Authority Calculation Engine (Phase 4B.3).
 * Formula:
 * Authority Score (0-100) =
 *   (Keyword Count * 2.5) + (Relationship Density * 25) + (Question Coverage * 20) + (SERP Coverage * 15) + (Community Coverage * 15)
 * NO LLM, 100% deterministic score capped between 0 and 100.
 */

export interface AuthorityInput {
  keywordCount: number;
  totalEdges: number;
  totalNodes: number;
  questionCount: number;
  serpCount: number;
  communityCount: number;
}

export function calculateTopicAuthority(input: AuthorityInput): number {
  const { keywordCount, totalEdges, totalNodes, questionCount, serpCount, communityCount } = input;

  const countScore = Math.min(30, keywordCount * 2.5);
  const densityRatio = totalNodes > 0 ? totalEdges / totalNodes : 0;
  const densityScore = Math.min(25, densityRatio * 12.5);
  const questionScore = Math.min(20, questionCount * 4.0);
  const serpScore = Math.min(15, serpCount * 3.0);
  const communityScore = Math.min(15, communityCount * 3.0);

  const rawScore = countScore + densityScore + questionScore + serpScore + communityScore;
  const finalScore = Math.min(100, Math.max(10, Number(rawScore.toFixed(1))));

  return finalScore;
}
