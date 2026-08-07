/**
 * services/seo/rules/performance-rules.ts
 * Performance Rules: SLOW_PAGE
 */

import type { SEORule, SEORuleContext, SEOIssue } from "../types";
import { createSEOIssue } from "../issue-normalizer";
import { ruleRegistry } from "../rule-registry";

export const SlowPageRule: SEORule = {
  ruleId: "SLOW_PAGE",
  name: "Slow Server Response Time",
  category: "PERFORMANCE",
  severity: "MEDIUM",
  evaluate(ctx: SEORuleContext): SEOIssue[] {
    const issues: SEOIssue[] = [];
    for (const page of ctx.pages) {
      if (page.response_time_ms > 2000) {
        issues.push(
          createSEOIssue({
            ruleId: "SLOW_PAGE",
            severity: "MEDIUM",
            category: "PERFORMANCE",
            issue: `Slow page load response time (${page.response_time_ms} ms)`,
            explanation: "Response times over 2 seconds hurt user bounce rates and Core Web Vitals performance scores.",
            recommendation: "Optimize server database queries, enable CDN caching, and reduce server TTFB.",
            affectedUrl: page.url,
          })
        );
      }
    }
    return issues;
  },
};

// Register Performance Rules
ruleRegistry.register(SlowPageRule);
