/**
 * services/qa-engine/validators/internal-links.ts
 *
 * 6. Internal Linking Validator
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateInternalLinks(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const links = input.internalLinks || [];

  if (links.length === 0) {
    score -= 30;
    findings.push("No internal links configured for this content");
    recommendations.push("Inject 1-3 internal links to relevant cluster pages or product pages");
  } else {
    findings.push(`Configured with ${links.length} internal link(s)`);

    // Generic anchor text check
    const genericAnchors = links.filter((l) => /click here|read more|link|this article/i.test(l.anchorText));
    if (genericAnchors.length > 0) {
      score -= 15;
      findings.push(`Detected ${genericAnchors.length} generic non-descriptive anchor text link(s)`);
      recommendations.push("Use entity-rich descriptive anchor text for all internal links");
    }
  }

  return {
    validatorId: "internal_linking",
    name: "Internal Linking Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
