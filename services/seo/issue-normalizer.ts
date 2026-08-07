/**
 * services/seo/issue-normalizer.ts
 *
 * Issue Normalizer Helper Module (Phase 4B.1).
 * Formats standardized SEOIssue objects with stable ruleId, severity, category, explanation, recommendation, and confidence.
 */

import type { SEOIssue, SEOSeverity, SEOCategory } from "./types";

export function createSEOIssue(params: {
  ruleId: string;
  severity: SEOSeverity;
  category: SEOCategory;
  issue: string;
  explanation: string;
  recommendation: string;
  affectedUrl: string;
  confidence?: number;
}): SEOIssue {
  const {
    ruleId,
    severity,
    category,
    issue,
    explanation,
    recommendation,
    affectedUrl,
    confidence = 1.0,
  } = params;

  // Generate deterministic issue ID
  const rawId = `${ruleId}_${affectedUrl}`;
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i);
    hash |= 0;
  }
  const id = `issue_${ruleId.toLowerCase()}_${Math.abs(hash).toString(16)}`;

  return {
    id,
    ruleId,
    severity,
    category,
    issue,
    explanation,
    recommendation,
    affectedUrl,
    confidence,
  };
}
