/**
 * services/seo/rules/canonical-rules.ts
 * Canonical Rules: CANONICAL_MISSING, CANONICAL_MISMATCH
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const CanonicalMissingRule: SEORule = {
  ruleId: "CANONICAL_MISSING",
  name: "Missing Canonical Tag",
  category: "INDEXABILITY",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (!page.canonical || !page.canonical.trim()) {
        issues.push(
          createSEOIssue({
            ruleId: "CANONICAL_MISSING",
            severity: "HIGH",
            category: "INDEXABILITY",
            issue: "Missing rel='canonical' link tag",
            explanation: "Without a canonical tag, search engines may index duplicate or parameter-based versions of the URL.",
            recommendation: "Add a self-referential rel='canonical' tag to specify the authoritative page URL.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const CanonicalMismatchRule: SEORule = {
  ruleId: "CANONICAL_MISMATCH",
  name: "Canonical URL Mismatch",
  category: "INDEXABILITY",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.canonical && page.canonical.trim() && page.canonical !== page.url) {
        issues.push(
          createSEOIssue({
            ruleId: "CANONICAL_MISMATCH",
            severity: "MEDIUM",
            category: "INDEXABILITY",
            issue: `Canonical tag points to different URL (${page.canonical})`,
            explanation: "This page instructs search engines that another URL is authoritative, preventing indexing of this page.",
            recommendation: "Verify whether this page is intentionally non-canonical, or update the canonical URL to point to itself.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Canonical Rules
ruleRegistry.register(CanonicalMissingRule);
ruleRegistry.register(CanonicalMismatchRule);
