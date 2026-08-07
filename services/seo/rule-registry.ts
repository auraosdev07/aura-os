/**
 * services/seo/rule-registry.ts
 *
 * Rule Registry Module (Phase 4B.1).
 * Central registry for registering and dynamically executing technical SEO rules.
 * Tracks rule execution profiling statistics (execution time, pages analyzed, issues generated).
 */

import type { SEORule, SEORuleContext, SEOIssue, RuleExecutionStat } from "./types";

class RuleRegistry {
  private rules = new Map<string, SEORule>();

  public register(rule: SEORule): void {
    this.rules.set(rule.ruleId, rule);
  }

  public getRules(): SEORule[] {
    return Array.from(this.rules.values());
  }

  public evaluateAll(ctx: SEORuleContext): { issues: SEOIssue[]; ruleStats: RuleExecutionStat[] } {
    const allIssues: SEOIssue[] = [];
    const ruleStats: RuleExecutionStat[] = [];

    for (const rule of this.rules.values()) {
      const startTime = Date.now();
      try {
        const issues = rule.evaluate(ctx);
        const executionTimeMs = Date.now() - startTime;

        allIssues.push(...issues);
        ruleStats.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          executionTimeMs,
          pagesAnalyzed: ctx.pages.length,
          issuesGenerated: issues.length,
        });
      } catch (err) {
        console.error(`[SEO RULE EVALUATION ERROR - ${rule.ruleId}]:`, err);
      }
    }

    return { issues: allIssues, ruleStats };
  }
}

export const ruleRegistry = new RuleRegistry();
