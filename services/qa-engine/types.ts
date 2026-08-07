/**
 * services/qa-engine/types.ts
 *
 * Unified Type Contracts for Phase 5.4 AI Quality Assurance & Publish Readiness Engine.
 * Supports evaluation across Blog Articles, Product SEO Profiles, Product Descriptions, Landing Pages, etc.
 */

export type QAContentType =
  | "BLOG_ARTICLE"
  | "PRODUCT_SEO_PROFILE"
  | "PRODUCT_DESCRIPTION"
  | "LANDING_PAGE"
  | "MARKETING_COPY"
  | "SUPPORT_REPLY";

export type PublishReadinessStatus = "READY_TO_PUBLISH" | "NEEDS_REVIEW" | "REJECT";

export type SeverityLevel = "INFO" | "WARNING" | "CRITICAL";

export type AIPatternProbability = "LOW" | "MEDIUM" | "HIGH";

export interface ValidatorResult {
  validatorId: string;
  name: string;
  score: number; // 0 - 100
  severity: SeverityLevel;
  findings: string[];
  recommendations: string[];
}

export interface ScorecardBreakdown {
  grammar: number;
  seo: number;
  eeat: number;
  readability: number;
  humanWriting: number;
  brandVoice: number;
  schema: number;
  internalLinking: number;
  contentCompleteness: number;
  ctr: number;
  metadata: number;
  aiPatternDetection: number;
  overallPublishScore: number;
}

export interface QAAuditReport {
  id?: string;
  contentType: QAContentType;
  resourceId: string;
  overallScore: number; // 0 - 100
  publishReadiness: PublishReadinessStatus;
  aiPatternProbability: AIPatternProbability;
  scorecard: ScorecardBreakdown;
  validatorResults: ValidatorResult[];
  reasons: string[];
  recommendations: string[];
  evaluatedBy?: string;
  createdAt?: string;
}

export interface QAInputPayload {
  contentType: QAContentType;
  resourceId: string;
  title: string;
  content?: string;
  shortDescription?: string;
  longDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  keyword?: string;
  sections?: Array<{ heading: string; level: string; content: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  benefits?: Array<{ title: string; description: string }>;
  schemas?: Array<Record<string, unknown>>;
  internalLinks?: Array<{ anchorText: string; targetUrl: string }>;
  images?: Array<Record<string, unknown>>;
}
