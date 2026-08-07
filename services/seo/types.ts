/**
 * services/seo/types.ts
 *
 * Types and Contracts for Phase 4B.1 SEO Intelligence Core.
 */

import type { CrawlPageRow, CrawlLinkRow, CrawlImageRow, CrawlMetadataRow } from "@/services/crawler/types";

export type SEOSeverity = "HIGH" | "MEDIUM" | "LOW";

export type SEOCategory =
  | "TECHNICAL"
  | "CONTENT"
  | "LINKS"
  | "IMAGES"
  | "PERFORMANCE"
  | "INDEXABILITY";

export interface SEOIssue {
  id: string;
  ruleId: string;
  severity: SEOSeverity;
  category: SEOCategory;
  issue: string;
  explanation: string;
  recommendation: string;
  affectedUrl: string;
  confidence: number;
}

export interface RuleExecutionStat {
  ruleId: string;
  ruleName: string;
  executionTimeMs: number;
  pagesAnalyzed: number;
  issuesGenerated: number;
}

export interface SEORuleContext {
  jobId: string;
  targetUrl: string;
  pages: CrawlPageRow[];
  links: CrawlLinkRow[];
  images: CrawlImageRow[];
  metadata: CrawlMetadataRow[];
}

export interface SEORule {
  ruleId: string;
  name: string;
  category: SEOCategory;
  severity: SEOSeverity;
  evaluate(ctx: SEORuleContext): SEOIssue[];
}

export interface SEOAuditReport {
  jobId: string;
  targetUrl: string;
  healthScore: number;
  totalIssues: number;
  issueCounts: {
    high: number;
    medium: number;
    low: number;
  };
  issues: SEOIssue[];
  ruleStats: RuleExecutionStat[];
  analyzedPagesCount: number;
  analyzedLinksCount: number;
  analyzedImagesCount: number;
  knowledgeDocumentId?: string;
  createdAt: string;
}
