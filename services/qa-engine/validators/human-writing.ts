/**
 * services/qa-engine/validators/human-writing.ts
 *
 * 2. Human Writing & Natural Flow Validator
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateHumanWriting(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const fullText = [
    input.title,
    input.content,
    input.longDescription,
    ...(input.sections || []).map((s) => s.content),
  ]
    .filter(Boolean)
    .join(" ");

  // Check for common AI clichés / fillers
  const clichéRegex = /\b(delve|tapestry|beacon|testament|nestled|realm|paramount|unwavering|game-changer|leverage|unlock)\b/gi;
  const matches = fullText.match(clichéRegex);

  if (matches && matches.length > 0) {
    score -= matches.length * 10;
    findings.push(`Detected ${matches.length} generic AI cliché word(s): [${Array.from(new Set(matches.map((m) => m.toLowerCase()))).join(", ")}]`);
    recommendations.push("Replace AI cliché vocabulary with grounded, human editorial tone");
  }

  // Paragraph length check
  const paragraphs = fullText.split(/\n+/).filter((p) => p.trim().length > 0);
  const wallOfText = paragraphs.filter((p) => p.split(" ").length > 120);
  if (wallOfText.length > 0) {
    score -= 15;
    findings.push(`Found ${wallOfText.length} paragraph(s) exceeding 120 words (wall of text)`);
    recommendations.push("Break dense paragraphs into shorter, natural reading blocks");
  }

  if (findings.length === 0) {
    findings.push("Writing flow exhibits natural human variance and varied paragraph structure");
  }

  return {
    validatorId: "human_writing",
    name: "Human Writing & Natural Flow Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
