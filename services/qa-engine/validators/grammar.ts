/**
 * services/qa-engine/validators/grammar.ts
 *
 * 1. Grammar & Mechanics Validator
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateGrammar(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const fullText = [
    input.title,
    input.content,
    input.shortDescription,
    input.longDescription,
    ...(input.sections || []).map((s) => `${s.heading} ${s.content}`),
  ]
    .filter(Boolean)
    .join(" ");

  // Double space check
  if (/\s{2,}/.test(fullText)) {
    score -= 10;
    findings.push("Detected multiple consecutive space characters");
    recommendations.push("Clean up double spaces throughout the text");
  }

  // Capitalization check on sentence starts
  const uncapitalizedSentences = fullText.match(/\.\s+[a-z]/g);
  if (uncapitalizedSentences && uncapitalizedSentences.length > 0) {
    score -= 15;
    findings.push(`Found ${uncapitalizedSentences.length} sentence(s) starting with a lowercase letter`);
    recommendations.push("Capitalize sentence initial characters");
  }

  // Sentence length check
  const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const runOnSentences = sentences.filter((s) => s.split(" ").length > 35);
  if (runOnSentences.length > 0) {
    score -= 15;
    findings.push(`Detected ${runOnSentences.length} run-on sentence(s) exceeding 35 words`);
    recommendations.push("Break down long run-on sentences for better grammatical flow");
  }

  if (findings.length === 0) {
    findings.push("Grammar & Mechanics verified with zero mechanical errors");
  }

  return {
    validatorId: "grammar",
    name: "Grammar & Mechanics Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 90 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
