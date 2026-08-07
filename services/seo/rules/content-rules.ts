/**
 * services/seo/rules/content-rules.ts
 * Content & Schema Rules: THIN_CONTENT, LANGUAGE_MISSING, JSONLD_MISSING, OPENGRAPH_MISSING, TWITTER_CARD_MISSING
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const ThinContentRule: SEORule = {
  ruleId: "THIN_CONTENT",
  name: "Thin Content Detected",
  category: "CONTENT",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.word_count < 300) {
        issues.push(
          createSEOIssue({
            ruleId: "THIN_CONTENT",
            severity: "HIGH",
            category: "CONTENT",
            issue: `Thin content detected (${page.word_count} words)`,
            explanation: "Pages under 300 words are flagged as thin content by search algorithms, lowering search rankings.",
            recommendation: "Expand content depth to provide thorough, helpful answers to user queries.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const JsonLdMissingRule: SEORule = {
  ruleId: "JSONLD_MISSING",
  name: "Missing Structured Data (JSON-LD)",
  category: "TECHNICAL",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      const schemas = page.json_ld || [];
      if (schemas.length === 0) {
        issues.push(
          createSEOIssue({
            ruleId: "JSONLD_MISSING",
            severity: "MEDIUM",
            category: "TECHNICAL",
            issue: "Missing JSON-LD Structured Data Schema",
            explanation: "Structured data helps search engines understand page entity context and unlock rich SERP snippets.",
            recommendation: "Implement appropriate Schema.org structured data (Organization, Article, WebPage, FAQPage, Product).",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const OpenGraphMissingRule: SEORule = {
  ruleId: "OPENGRAPH_MISSING",
  name: "Missing OpenGraph Social Tags",
  category: "TECHNICAL",
  severity: "LOW",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      const og = page.opengraph || {};
      if (!og["og:title"] || !og["og:description"]) {
        issues.push(
          createSEOIssue({
            ruleId: "OPENGRAPH_MISSING",
            severity: "LOW",
            category: "TECHNICAL",
            issue: "Missing OpenGraph meta tags (og:title / og:description)",
            explanation: "OpenGraph tags ensure rich social media cards when link is shared on Facebook, LinkedIn, or messaging apps.",
            recommendation: "Add og:title, og:description, and og:image tags.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Content Rules
ruleRegistry.register(ThinContentRule);
ruleRegistry.register(JsonLdMissingRule);
ruleRegistry.register(OpenGraphMissingRule);
