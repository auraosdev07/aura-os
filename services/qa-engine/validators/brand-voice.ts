/**
 * services/qa-engine/validators/brand-voice.ts
 *
 * 10. Brand Voice & Tone Validator
 * Verifies Aura & Soul brand tone guidelines: Premium, Luxury, Healing, Trustworthy, Calm.
 * Rejects exaggerated or cheap sales pitch language.
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateBrandVoice(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const fullText = [
    input.title,
    input.content,
    input.shortDescription,
    input.longDescription,
    ...(input.sections || []).map((s) => s.content),
  ]
    .filter(Boolean)
    .join(" ");

  // Cheap sales pitch words check
  const cheapSalesWords = /\b(cheap|insane discount|buy immediately|hurry|limited time deal|blowout sale|dirt cheap|rock bottom)\b/gi;
  const cheapMatches = fullText.match(cheapSalesWords);

  if (cheapMatches && cheapMatches.length > 0) {
    score -= 30;
    findings.push(`Exaggerated cheap sales pitch wording detected: [${Array.from(new Set(cheapMatches.map((m) => m.toLowerCase()))).join(", ")}]`);
    recommendations.push("Replace cheap sales pitch vocabulary with calm, luxury, authentic brand phrasing");
  }

  // Preferred Aura & Soul luxury / healing tone keywords check
  const luxuryKeywords = /premium|handcrafted|holistic|authentic|calm|tranquility|spiritual|healing|natural|artisan/i;
  if (!luxuryKeywords.test(fullText)) {
    score -= 15;
    findings.push("Low alignment with Aura & Soul luxury/healing brand voice");
    recommendations.push("Weave in brand tone words such as 'handcrafted', 'authentic', 'holistic', or 'tranquility'");
  } else {
    findings.push("Strong alignment with Aura & Soul luxury, healing, and calm brand voice");
  }

  return {
    validatorId: "brand_voice",
    name: "Brand Voice & Tone Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
