/**
 * services/seo/rules/meta-rules.ts
 * Meta Description Rules: META_DESCRIPTION_MISSING, META_DESCRIPTION_DUPLICATE, META_DESCRIPTION_TOO_SHORT, META_DESCRIPTION_TOO_LONG
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const MetaMissingRule: SEORule = {
  ruleId: "META_DESCRIPTION_MISSING",
  name: "Missing Meta Description",
  category: "TECHNICAL",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (!page.meta_description || !page.meta_description.trim()) {
        issues.push(
          createSEOIssue({
            ruleId: "META_DESCRIPTION_MISSING",
            severity: "HIGH",
            category: "TECHNICAL",
            issue: "Missing Meta Description tag",
            explanation: "Pages without meta descriptions let search engines generate random snippets, reducing CTR.",
            recommendation: "Add a compelling meta description between 70 and 160 characters.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const MetaDuplicateRule: SEORule = {
  ruleId: "META_DESCRIPTION_DUPLICATE",
  name: "Duplicate Meta Descriptions",
  category: "TECHNICAL",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    const metaMap = new Map<string, string[]>();

    for (const page of ctx.pages) {
      if (page.meta_description && page.meta_description.trim()) {
        const cleanDesc = page.meta_description.trim().toLowerCase();
        const existing = metaMap.get(cleanDesc) || [];
        metaMap.set(cleanDesc, [...existing, page.url]);
      }
    }

    for (const [, urls] of metaMap.entries()) {
      if (urls.length > 1) {
        for (const url of urls) {
          issues.push(
            createSEOIssue({
              ruleId: "META_DESCRIPTION_DUPLICATE",
              severity: "MEDIUM",
              category: "TECHNICAL",
              issue: `Duplicate meta description shared across ${urls.length} pages`,
              explanation: "Identical meta descriptions make it harder for search engine users to distinguish content.",
              recommendation: "Create unique meta descriptions tailored to each page's primary goal.",
              affectedUrl: url,
            })
          );
        }
      }
    }
    return issues;
  },
};

export const MetaTooShortRule: SEORule = {
  ruleId: "META_DESCRIPTION_TOO_SHORT",
  name: "Meta Description Too Short",
  category: "TECHNICAL",
  severity: "LOW",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.meta_description && page.meta_description.trim().length > 0 && page.meta_description.trim().length < 70) {
        issues.push(
          createSEOIssue({
            ruleId: "META_DESCRIPTION_TOO_SHORT",
            severity: "LOW",
            category: "TECHNICAL",
            issue: `Meta description is too short (${page.meta_description.trim().length} characters)`,
            explanation: "Descriptions under 70 characters leave SERP real estate unused.",
            recommendation: "Expand meta description to between 70 and 160 characters.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const MetaTooLongRule: SEORule = {
  ruleId: "META_DESCRIPTION_TOO_LONG",
  name: "Meta Description Too Long",
  category: "TECHNICAL",
  severity: "LOW",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.meta_description && page.meta_description.trim().length > 160) {
        issues.push(
          createSEOIssue({
            ruleId: "META_DESCRIPTION_TOO_LONG",
            severity: "LOW",
            category: "TECHNICAL",
            issue: `Meta description exceeds 160 characters (${page.meta_description.trim().length} characters)`,
            explanation: "Descriptions longer than 160 characters will be truncated in search results.",
            recommendation: "Shorten meta description to 160 characters or fewer.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Meta Rules
ruleRegistry.register(MetaMissingRule);
ruleRegistry.register(MetaDuplicateRule);
ruleRegistry.register(MetaTooShortRule);
ruleRegistry.register(MetaTooLongRule);
