/**
 * services/qa-engine/validators/eeat.ts
 *
 * 5. EEAT & Safety Compliance Validator
 * Verifies Experience, Expertise, Authoritativeness, Trustworthiness, Unsupported Claims, and Disclaimers.
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateEEAT(input: QAInputPayload): ValidatorResult {
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

  // Unsupported medical / health claims check
  const medicalClaimRegex = /\b(cure|cures|guarantee|guaranteed|medical miracle|proven remedy)\b/gi;
  const claimMatches = fullText.match(medicalClaimRegex);

  if (claimMatches && claimMatches.length > 0) {
    score -= 30;
    findings.push(`Unsupported claim wording detected: [${Array.from(new Set(claimMatches.map((m) => m.toLowerCase()))).join(", ")}]`);
    recommendations.push("Replace medical/guaranteed claim language with holistic wellness framing");
  }

  // Holistic Crystal / Healing Disclaimer requirement check
  const isHealingContent = /crystal|healing|amethyst|quartz|citrine|chakra|energy/i.test(fullText);
  const hasDisclaimer = /disclaimer|consult|medical advice|wellness purpose/i.test(fullText);

  if (isHealingContent && !hasDisclaimer) {
    score -= 20;
    findings.push("Missing required holistic wellness disclaimer for crystal/healing content");
    recommendations.push("Add standard holistic wellness disclaimer: 'Crystals are intended for spiritual support and not a substitute for professional medical advice.'");
  } else if (hasDisclaimer) {
    findings.push("Required holistic wellness disclaimer present");
  }

  // Authoritativeness & Trust references
  const TrustKeywords = /certified|authentic|expert|craftsmanship|natural|ethically sourced/i;
  if (!TrustKeywords.test(fullText)) {
    score -= 10;
    findings.push("Low trust signals in body copy");
    recommendations.push("Incorporate trust signals such as 'ethically sourced', '100% natural', or 'expert craftsmanship'");
  } else {
    findings.push("Trust & authenticity signals verified in content");
  }

  return {
    validatorId: "eeat",
    name: "EEAT & Safety Compliance Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
