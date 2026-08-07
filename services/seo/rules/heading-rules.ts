/**
 * services/seo/rules/heading-rules.ts
 * Heading Rules: H1_MISSING, H1_MULTIPLE, HEADING_HIERARCHY_INVALID
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const H1MissingRule: SEORule = {
  ruleId: "H1_MISSING",
  name: "Missing H1 Tag",
  category: "CONTENT",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      const h1s = page.h1_tags || [];
      if (h1s.length === 0) {
        issues.push(
          createSEOIssue({
            ruleId: "H1_MISSING",
            severity: "HIGH",
            category: "CONTENT",
            issue: "Missing H1 Heading tag",
            explanation: "The page lacks an <h1> heading tag, which defines the main subject of the page for search engines.",
            recommendation: "Add exactly one primary <h1> tag containing target keywords.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const H1MultipleRule: SEORule = {
  ruleId: "H1_MULTIPLE",
  name: "Multiple H1 Tags",
  category: "CONTENT",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      const h1s = page.h1_tags || [];
      if (h1s.length > 1) {
        issues.push(
          createSEOIssue({
            ruleId: "H1_MULTIPLE",
            severity: "MEDIUM",
            category: "CONTENT",
            issue: `Multiple H1 Heading tags found (${h1s.length} H1 tags)`,
            explanation: "Having multiple <h1> tags dilutes topic focus and confuses heading structure.",
            recommendation: "Ensure each page has only one primary <h1> tag, using <h2> for subheadings.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const HeadingHierarchyInvalidRule: SEORule = {
  ruleId: "HEADING_HIERARCHY_INVALID",
  name: "Invalid Heading Hierarchy",
  category: "CONTENT",
  severity: "LOW",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      const h2s = page.h2_tags || [];
      const h3s = page.h3_tags || [];

      // E.g., H3 present without preceding H2
      if (h3s.length > 0 && h2s.length === 0) {
        issues.push(
          createSEOIssue({
            ruleId: "HEADING_HIERARCHY_INVALID",
            severity: "LOW",
            category: "CONTENT",
            issue: "Heading hierarchy skipped H2 level (H3 used without H2)",
            explanation: "Heading tags should follow a logical nested order (H1 -> H2 -> H3) for document outline clarity.",
            recommendation: "Re-organize headings so H3 tags are nested within parent H2 sections.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Heading Rules
ruleRegistry.register(H1MissingRule);
ruleRegistry.register(H1MultipleRule);
ruleRegistry.register(HeadingHierarchyInvalidRule);
