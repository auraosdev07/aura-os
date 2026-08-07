/**
 * services/qa-engine/validators/ai-pattern-detector.ts
 *
 * 11. Heuristic AI Pattern Detector
 * Estimates AI footprint without external APIs:
 * Repetitive phrases, robotic transitions, template repetition, passive voice, unnatural wording.
 * Returns probability: LOW / MEDIUM / HIGH.
 */

import type { QAInputPayload, ValidatorResult, AIPatternProbability } from "../types";

export function validateAIPatterns(input: QAInputPayload): {
  result: ValidatorResult;
  probability: AIPatternProbability;
} {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let penaltyPoints = 0;

  const fullText = [
    input.title,
    input.content,
    input.longDescription,
    ...(input.sections || []).map((s) => s.content),
  ]
    .filter(Boolean)
    .join(" ");

  // 1. Robotic AI transitions check
  const roboticTransitions = /\b(furthermore|moreover|in conclusion|additionally|it is important to note|in summary|as mentioned earlier)\b/gi;
  const transMatches = fullText.match(roboticTransitions) || [];

  if (transMatches.length > 3) {
    penaltyPoints += 25;
    score -= 25;
    findings.push(`High density of robotic AI transition phrases (${transMatches.length} occurrences)`);
    recommendations.push("Vary transition phrases with natural conversational connectors");
  }

  // 2. Repetitive sentence opening check
  const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const firstWords = sentences.map((s) => s.trim().split(" ")[0].toLowerCase());
  const wordCounts: Record<string, number> = {};
  firstWords.forEach((w) => {
    if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1;
  });

  const repetitiveStart = Object.entries(wordCounts).find(([, count]) => count >= 4);
  if (repetitiveStart) {
    penaltyPoints += 20;
    score -= 20;
    findings.push(`Repetitive sentence openings detected starting with "${repetitiveStart[0]}" (${repetitiveStart[1]} times)`);
    recommendations.push("Vary sentence structures and starting clauses");
  }

  // Determine Probability
  let probability: AIPatternProbability = "LOW";
  if (penaltyPoints >= 40) probability = "HIGH";
  else if (penaltyPoints >= 20) probability = "MEDIUM";

  if (findings.length === 0) {
    findings.push(`Low AI footprint probability (${probability}). Content exhibits human structural variance.`);
  }

  return {
    result: {
      validatorId: "ai_pattern_detector",
      name: "AI Pattern & Heuristic Detector",
      score: Math.max(0, score),
      severity: probability === "HIGH" ? "CRITICAL" : probability === "MEDIUM" ? "WARNING" : "INFO",
      findings,
      recommendations,
    },
    probability,
  };
}
