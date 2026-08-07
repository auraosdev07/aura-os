/**
 * services/seo/seo-audit-engine.ts
 *
 * Core SEO Audit Engine (Phase 4B.1).
 * Reads normalized crawl dataset from database (crawl_jobs, crawl_pages, crawl_links, crawl_images, crawl_metadata).
 * NO LIVE WEBSITE REQUESTS. NO LLM REASONING.
 * Evaluates rules dynamically via RuleRegistry, computes weighted health score, auto-saves to Knowledge,
 * generates non-duplicate tasks for HIGH severity issues, and returns rule execution statistics.
 */

import { getCrawlResults } from "@/services/crawler/crawl-storage";
import { ruleRegistry } from "./rule-registry";
import { calculateHealthScore } from "./health-score";
import { saveSEOAuditToKnowledge } from "./seo-audit-knowledge";
import { generateTasksFromSEOAudit } from "./seo-task-generator";
import type { SEOAuditReport, SEORuleContext } from "./types";

// Import all rule definitions to ensure registration
import "./rules/title-rules";
import "./rules/meta-rules";
import "./rules/heading-rules";
import "./rules/canonical-rules";
import "./rules/image-rules";
import "./rules/link-rules";
import "./rules/content-rules";
import "./rules/performance-rules";

export async function auditCrawl(jobId: string): Promise<SEOAuditReport> {
  // 1. Read normalized crawl dataset from PostgreSQL DB
  const crawlData = await getCrawlResults(jobId);
  const { job, pages, links, images } = crawlData;

  const ctx: SEORuleContext = {
    jobId: job.id,
    targetUrl: job.target_url,
    pages,
    links,
    images,
    metadata: [],
  };

  // 2. Evaluate all rules dynamically via RuleRegistry & collect execution stats
  const { issues, ruleStats } = ruleRegistry.evaluateAll(ctx);

  // 3. Compute weighted site health score (0-100)
  const healthScore = calculateHealthScore(issues);

  // Issue Counts
  const highCount = issues.filter((i) => i.severity === "HIGH").length;
  const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
  const lowCount = issues.filter((i) => i.severity === "LOW").length;

  const report: SEOAuditReport = {
    jobId: job.id,
    targetUrl: job.target_url,
    healthScore,
    totalIssues: issues.length,
    issueCounts: {
      high: highCount,
      medium: mediumCount,
      low: lowCount,
    },
    issues,
    ruleStats,
    analyzedPagesCount: pages.length,
    analyzedLinksCount: links.length,
    analyzedImagesCount: images.length,
    createdAt: new Date().toISOString(),
  };

  // 4. Knowledge Engine Auto-Integration
  const knowledgeDocumentId = await saveSEOAuditToKnowledge(report);
  report.knowledgeDocumentId = knowledgeDocumentId;

  // 5. Automatic Non-Duplicate Task Generation for HIGH severity issues
  await generateTasksFromSEOAudit(job.id, job.target_url, issues);

  return report;
}
