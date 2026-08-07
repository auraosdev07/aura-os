/**
 * services/qa-engine/validators/readability.ts
 *
 * 3. Readability & Tone Validator
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateReadability(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const fullText = [
    input.content,
    input.longDescription,
    ...(input.sections || []).map((s) => s.content),
  ]
    .filter(Boolean)
    .join(" ");

  const words = fullText.split(/\s+/).filter(Boolean);
  const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (words.length === 0 || sentences.length === 0) {
    return {
      validatorId: "readability",
      name: "Readability Validator",
      score: 50,
      severity: "WARNING",
      findings: ["Insufficient text content to perform readability analysis"],
      recommendations: ["Provide full section text"],
    };
  }

  const avgWordsPerSentence = words.length / sentences.length;

  if (avgWordsPerSentence > 25) {
    score -= 20;
    findings.push(`High average sentence length (${avgWordsPerSentence.toFixed(1)} words/sentence)`);
    recommendations.push("Target an average of 14-18 words per sentence for optimal readability");
  } else if (avgWordsPerSentence < 8) {
    score -= 10;
    findings.push(`Staccato sentence pattern (${avgWordsPerSentence.toFixed(1)} words/sentence)`);
    recommendations.push("Combine overly short sentences for better cadence");
  } else {
    findings.push(`Optimal sentence density (${avgWordsPerSentence.toFixed(1)} words/sentence)`);
  }

  return {
    validatorId: "readability",
    name: "Readability Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
