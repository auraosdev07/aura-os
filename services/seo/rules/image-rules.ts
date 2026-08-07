/**
 * services/seo/rules/image-rules.ts
 * Image Rules: IMAGE_ALT_MISSING, IMAGE_ALT_EMPTY, IMAGE_OVERSIZED
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const ImageAltMissingRule: SEORule = {
  ruleId: "IMAGE_ALT_MISSING",
  name: "Missing Image Alt Text",
  category: "IMAGES",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    const missingAltCountMap = new Map<string, number>();

    for (const img of ctx.images) {
      if (!img.alt_text || !img.alt_text.trim()) {
        const page = ctx.pages.find((p) => p.id === img.page_id);
        const url = page ? page.url : ctx.targetUrl;
        missingAltCountMap.set(url, (missingAltCountMap.get(url) || 0) + 1);
      }
    }

    for (const [url, count] of missingAltCountMap.entries()) {
      issues.push(
        createSEOIssue({
          ruleId: "IMAGE_ALT_MISSING",
          severity: "MEDIUM",
          category: "IMAGES",
          issue: `${count} image(s) missing descriptive alt text`,
          explanation: "Alt text provides accessibility context for screen readers and allows images to index in image search.",
          recommendation: "Add descriptive, non-empty alt text to all non-decorative <img> elements.",
          affectedUrl: url,
        })
      );
    }
    return issues;
  },
};

export const ImageOversizedRule: SEORule = {
  ruleId: "IMAGE_OVERSIZED",
  name: "Oversized Page Payload",
  category: "IMAGES",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      // > 500 KB (500,000 bytes)
      if (page.page_size_bytes > 500000) {
        const sizeKb = Math.round(page.page_size_bytes / 1024);
        issues.push(
          createSEOIssue({
            ruleId: "IMAGE_OVERSIZED",
            severity: "MEDIUM",
            category: "IMAGES",
            issue: `Large page payload size (${sizeKb} KB)`,
            explanation: "Excessive HTML payload or embedded assets slow page loading speed.",
            recommendation: "Compress image assets, inline critical CSS, and reduce unnecessary JavaScript bundles.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Image Rules
ruleRegistry.register(ImageAltMissingRule);
ruleRegistry.register(ImageOversizedRule);
