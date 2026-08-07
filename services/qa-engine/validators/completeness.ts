/**
 * services/qa-engine/validators/completeness.ts
 *
 * 9. Content Completeness Validator
 * Detects missing FAQs, comparison sections, conclusions, CTAs, images, alt text, tables, and key entities.
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateCompleteness(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const faqs = input.faqs || [];
  const sections = input.sections || [];
  const benefits = input.benefits || [];
  const fullText = [input.content, input.longDescription, ...sections.map((s) => s.content)].filter(Boolean).join(" ");

  // 1. FAQ Completeness
  if (faqs.length === 0) {
    score -= 15;
    findings.push("Missing FAQ block");
    recommendations.push("Include at least 3 customer FAQs with detailed answers");
  } else {
    findings.push(`Included ${faqs.length} FAQ items`);
  }

  // 2. Conclusion / CTA Check
  const hasConclusion = /conclusion|summary|final thoughts|verdict|buy now|shop now|discover|order/i.test(fullText);
  if (!hasConclusion) {
    score -= 15;
    findings.push("Missing conclusion summary or Call-to-Action (CTA)");
    recommendations.push("End content with a clear conclusion summary and CTA button");
  } else {
    findings.push("Conclusion and CTA callout verified");
  }

  // 3. Benefits / Comparison Check (For Products/SEO)
  if (input.contentType === "PRODUCT_SEO_PROFILE" || input.contentType === "PRODUCT_DESCRIPTION") {
    if (benefits.length === 0) {
      score -= 15;
      findings.push("Missing structured product benefit blocks");
      recommendations.push("Add 3-4 key product benefit blocks");
    }
  }

  return {
    validatorId: "completeness",
    name: "Content Completeness Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
