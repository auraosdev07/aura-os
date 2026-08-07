/**
 * services/seo/rules/title-rules.ts
 * Title SEO Rules: TITLE_MISSING, TITLE_DUPLICATE, TITLE_TOO_SHORT, TITLE_TOO_LONG
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const TitleMissingRule: SEORule = {
  ruleId: "TITLE_MISSING",
  name: "Missing Title Tag",
  category: "TECHNICAL",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (!page.title || !page.title.trim()) {
        issues.push(
          createSEOIssue({
            ruleId: "TITLE_MISSING",
            severity: "HIGH",
            category: "TECHNICAL",
            issue: "Missing HTML <title> tag",
            explanation: "The page has no title tag defined, severely harming search engine visibility and CTR.",
            recommendation: "Add a descriptive, unique title tag between 30 and 60 characters.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const TitleDuplicateRule: SEORule = {
  ruleId: "TITLE_DUPLICATE",
  name: "Duplicate Title Tags",
  category: "TECHNICAL",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    const titleMap = new Map<string, string[]>();

    for (const page of ctx.pages) {
      if (page.title && page.title.trim()) {
        const cleanTitle = page.title.trim().toLowerCase();
        const existing = titleMap.get(cleanTitle) || [];
        titleMap.set(cleanTitle, [...existing, page.url]);
      }
    }

    for (const [titleStr, urls] of titleMap.entries()) {
      if (urls.length > 1) {
        for (const url of urls) {
          issues.push(
            createSEOIssue({
              ruleId: "TITLE_DUPLICATE",
              severity: "HIGH",
              category: "TECHNICAL",
              issue: `Duplicate title tag shared across ${urls.length} pages`,
              explanation: `Title "${titleStr}" is shared with other pages (${urls.filter((u) => u !== url).slice(0, 2).join(", ")}).`,
              recommendation: "Ensure each page on your website has a unique, descriptive title tag.",
              affectedUrl: url,
            })
          );
        }
      }
    }
    return issues;
  },
};

export const TitleTooShortRule: SEORule = {
  ruleId: "TITLE_TOO_SHORT",
  name: "Title Tag Too Short",
  category: "TECHNICAL",
  severity: "LOW",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.title && page.title.trim().length > 0 && page.title.trim().length < 30) {
        issues.push(
          createSEOIssue({
            ruleId: "TITLE_TOO_SHORT",
            severity: "LOW",
            category: "TECHNICAL",
            issue: `Title tag is too short (${page.title.trim().length} characters)`,
            explanation: "Title tags under 30 characters miss valuable keyword targeting opportunities.",
            recommendation: "Expand the title tag to between 30 and 60 characters.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const TitleTooLongRule: SEORule = {
  ruleId: "TITLE_TOO_LONG",
  name: "Title Tag Too Long",
  category: "TECHNICAL",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.title && page.title.trim().length > 60) {
        issues.push(
          createSEOIssue({
            ruleId: "TITLE_TOO_LONG",
            severity: "MEDIUM",
            category: "TECHNICAL",
            issue: `Title tag exceeds 60 characters (${page.title.trim().length} characters)`,
            explanation: "Title tags longer than 60 characters are truncated in SERP search results.",
            recommendation: "Shorten title tag to 60 characters or fewer.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Title Rules
ruleRegistry.register(TitleMissingRule);
ruleRegistry.register(TitleDuplicateRule);
ruleRegistry.register(TitleTooShortRule);
ruleRegistry.register(TitleTooLongRule);
