/**
 * services/seo/health-score.ts
 *
 * Weighted Health Scoring Engine (Phase 4B.1).
 * Calculates overall site health score (0-100) based on weighted issue severity deductions.
 * Deductions: High = -8, Medium = -3, Low = -1.
 */

import type { SEOIssue } from "./types";

export function calculateHealthScore(issues: SEOIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "HIGH") {
      score -= 8;
    } else if (issue.severity === "MEDIUM") {
      score -= 3;
    } else if (issue.severity === "LOW") {
      score -= 1;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
