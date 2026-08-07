/**
 * services/qa-engine/validators/ctr.ts
 *
 * 12. CTR (Click-Through Rate) Potential Validator
 * Evaluates Title Hook, Meta Description Call-to-Action, Opening Paragraph Hook, and Conversational Engagement.
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateCTR(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const title = input.title || input.metaTitle || "";
  const metaDesc = input.metaDescription || "";
  const fullText = [input.content, input.shortDescription, input.longDescription].filter(Boolean).join(" ");

  // 1. Power word / Emotional hook in Title
  const powerWords = /guide|ultimate|secret|benefits|how to|top|essential|best|complete|natural|transformation/i;
  if (!powerWords.test(title)) {
    score -= 20;
    findings.push("Title lacks strong emotional or curiosity hook (power words)");
    recommendations.push("Include engagement power words in Title (e.g. 'Essential', 'Guide', 'Ultimate')");
  } else {
    findings.push("Title contains strong click-through hook");
  }

  // 2. Action CTA in Meta Description
  const ctaWords = /discover|explore|learn|shop|find out|get|read|unlock|experience/i;
  if (!ctaWords.test(metaDesc)) {
    score -= 15;
    findings.push("Meta Description lacks a clear action prompt (CTA)");
    recommendations.push("Add a clear action verb to Meta Description (e.g., 'Discover the benefits now.')");
  } else {
    findings.push("Meta Description includes action prompt");
  }

  // 3. Opening Hook in first 200 characters
  const opening = fullText.slice(0, 200);
  if (opening.length < 50) {
    score -= 15;
    findings.push("Short or weak opening hook");
    recommendations.push("Craft a strong opening hook in the first 2 sentences");
  }

  return {
    validatorId: "ctr",
    name: "CTR & Engagement Potential Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
