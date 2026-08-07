/**
 * services/qa-engine/validators/metadata.ts
 *
 * 8. Metadata Validator
 */

import type { QAInputPayload, ValidatorResult } from "../types";

export function validateMetadata(input: QAInputPayload): ValidatorResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!input.title || input.title.trim().length === 0) {
    score -= 30;
    findings.push("Missing primary title");
    recommendations.push("Provide a compelling primary title");
  }

  if (!input.metaTitle || input.metaTitle.trim().length === 0) {
    score -= 20;
    findings.push("Missing meta title");
    recommendations.push("Configure explicit meta title for SEO");
  }

  if (!input.metaDescription || input.metaDescription.trim().length === 0) {
    score -= 20;
    findings.push("Missing meta description");
    recommendations.push("Configure explicit meta description for search engine snippets");
  }

  if (!input.slug || input.slug.trim().length === 0) {
    score -= 20;
    findings.push("Missing URL slug");
    recommendations.push("Generate clean URL slug");
  }

  if (findings.length === 0) {
    findings.push("All required metadata attributes (Title, Meta Title, Meta Description, Slug) fully specified");
  }

  return {
    validatorId: "metadata",
    name: "Metadata Validator",
    score: Math.max(0, score),
    severity: score < 70 ? "CRITICAL" : score < 85 ? "WARNING" : "INFO",
    findings,
    recommendations,
  };
}
