/**
 * services/seo/rules/link-rules.ts
 * Link Rules: BROKEN_INTERNAL_LINK, BROKEN_EXTERNAL_LINK, ORPHAN_PAGE, DEAD_END_PAGE, EXCESSIVE_OUTGOING_LINKS
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const BrokenInternalLinkRule: SEORule = {
  ruleId: "BROKEN_INTERNAL_LINK",
  name: "Broken Internal Links",
  category: "LINKS",
  severity: "HIGH",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    const internalLinks = ctx.links.filter((l) => l.is_internal);

    for (const link of internalLinks) {
      const targetPage = ctx.pages.find((p) => p.url === link.target_url || p.final_url === link.target_url);
      if (targetPage && targetPage.status_code >= 400) {
        const sourcePage = ctx.pages.find((p) => p.id === link.source_page_id);
        const sourceUrl = sourcePage ? sourcePage.url : ctx.targetUrl;

        issues.push(
          createSEOIssue({
            ruleId: "BROKEN_INTERNAL_LINK",
            severity: "HIGH",
            category: "LINKS",
            issue: `Broken internal link pointing to HTTP ${targetPage.status_code} (${link.target_url})`,
            explanation: "Internal broken links waste crawl budget, break navigation, and create negative user experiences.",
            recommendation: `Update or remove the link to ${link.target_url} on ${sourceUrl}.`,
            affectedUrl: sourceUrl,
          })
        );
      }
    }
    return issues;
  },
};

export const OrphanPageRule: SEORule = {
  ruleId: "ORPHAN_PAGE",
  name: "Orphan Page Detected",
  category: "LINKS",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    const targetUrlsWithIncoming = new Set(ctx.links.filter((l) => l.is_internal).map((l) => l.target_url));

    for (const page of ctx.pages) {
      // Exclude homepage root
      if (page.url !== ctx.targetUrl && page.depth > 0 && !targetUrlsWithIncoming.has(page.url)) {
        issues.push(
          createSEOIssue({
            ruleId: "ORPHAN_PAGE",
            severity: "MEDIUM",
            category: "LINKS",
            issue: "Orphan page detected (0 incoming internal links)",
            explanation: "Pages without internal links are difficult for search engine crawlers to discover and rank.",
            recommendation: "Add internal links pointing to this page from relevant category or navigation pages.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

export const ExcessiveOutgoingLinksRule: SEORule = {
  ruleId: "EXCESSIVE_OUTGOING_LINKS",
  name: "Too Many Outgoing Links",
  category: "LINKS",
  severity: "LOW",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    const linkCounts = new Map<string, number>();

    for (const link of ctx.links) {
      linkCounts.set(link.source_page_id, (linkCounts.get(link.source_page_id) || 0) + 1);
    }

    for (const [sourcePageId, count] of linkCounts.entries()) {
      if (count > 100) {
        const page = ctx.pages.find((p) => p.id === sourcePageId);
        if (page) {
          issues.push(
            createSEOIssue({
              ruleId: "EXCESSIVE_OUTGOING_LINKS",
              severity: "LOW",
              category: "LINKS",
              issue: `Page contains excessive outgoing links (${count} links)`,
              explanation: "Having more than 100 outgoing links per page dilutes LinkJuice and hurts user readability.",
              recommendation: "Consolidate links, prune low-value links, or paginate long link lists.",
              affectedUrl: page.url,
            })
          );
        }
      }
    }
    return issues;
  },
};

// Register Link Rules
ruleRegistry.register(BrokenInternalLinkRule);
ruleRegistry.register(OrphanPageRule);
ruleRegistry.register(ExcessiveOutgoingLinksRule);
