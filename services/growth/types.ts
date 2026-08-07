/**
 * services/growth/types.ts
 *
 * Core Data Transfer Objects & Type Definitions for Phase 6.0 Growth Intelligence Department.
 */

export interface NormalizedTrendDTO {
  providerId: string;
  keyword: string;
  category: string;
  searchVolumeIndex: number; // 0 - 100
  growthVelocity: number; // Rate of growth %
  sentimentScore: number; // -1.0 to 1.0
  rawPayload?: Record<string, unknown>;
}

export interface TrendAdapterInterface {
  providerId: string;
  providerName: string;
  category: string;
  fetchTrends(category?: string): Promise<NormalizedTrendDTO[]>;
}

export interface CompetitorProfileDTO {
  id?: string;
  name: string;
  websiteUrl: string;
  category: string;
  pricingTier: "BUDGET" | "MID_TIER" | "LUXURY" | "HIGH_END";
  seoAuthorityScore: number; // 0 - 100
  blogFrequencyPerWeek: number;
}

export interface CompetitorSnapshotDTO {
  id?: string;
  competitorId: string;
  newLaunches: Array<{ name: string; category: string; price?: number }>;
  pricingChanges: Array<{ sku: string; oldPrice: number; newPrice: number }>;
  seoMetaChanges: Array<{ pageUrl: string; field: string; newValue: string }>;
  activeOffers: Array<{ offerTitle: string; discountPercent?: number }>;
  capturedAt?: string;
}

export type OpportunityType =
  | "MISSING_KEYWORD"
  | "LOW_COMPETITION_PRODUCT"
  | "SEASONAL_DEMAND"
  | "CONTENT_GAP"
  | "MARKET_GAP";

export type OpportunityStatus = "ACTIVE" | "ENQUEUED" | "DISMISSED" | "COMPLETED";

export interface MarketOpportunityDTO {
  id?: string;
  title: string;
  type: OpportunityType;
  category: string;
  targetKeyword?: string;
  businessValueScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  futurePotentialScore: number; // 0 - 100
  reasoning: string;
  status: OpportunityStatus;
  createdAt?: string;
}

export interface GrowthScoreExplanationDTO {
  dimension: string;
  score: number;
  weight: number;
  reason: string;
}

export interface GrowthScoreDTO {
  id?: string;
  overallScore: number; // 0 - 100
  trendVelocityScore: number;
  competitorGapScore: number;
  seoMomentumScore: number;
  productReadinessScore: number;
  freshnessScore: number;
  explanation: GrowthScoreExplanationDTO[];
  createdAt?: string;
}

export interface DailyCEOBriefDTO {
  id?: string;
  briefDate: string; // YYYY-MM-DD
  growthScore: number;
  topTrends: NormalizedTrendDTO[];
  competitorChanges: Array<{ competitorName: string; changeSummary: string }>;
  recommendedActions: Array<{ actionTitle: string; impact: string; urgency: "HIGH" | "MEDIUM" | "LOW" }>;
  warnings: string[];
  priorityList: string[];
  createdAt?: string;
}

/* ── Phase 6.1 Real-Time Collection Engine Types ─────────── */

export type ScheduledJobStatus = "IDLE" | "RUNNING" | "FAILED" | "DISABLED";

export interface ScheduledJobDTO {
  id: string;
  providerId: string;
  cronSchedule: string;
  lastRunAt?: string;
  nextRunAt: string;
  status: ScheduledJobStatus;
  retryCount: number;
}

export interface JobRunDTO {
  id?: string;
  jobId: string;
  status: "SUCCESS" | "FAILED";
  itemsProcessed: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TrendHistoryDTO {
  id?: string;
  keyword: string;
  category: string;
  providerId: string;
  searchVolumeIndex: number;
  growthVelocity: number;
  recordedAt: string;
}

export type TrendAlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type TrendAlertType =
  | "TREND_SPIKE"
  | "TREND_DROP"
  | "COMPETITOR_CHANGE"
  | "SEASONAL_OPPORTUNITY"
  | "KEYWORD_MOVEMENT"
  | "PROVIDER_FAILURE";

export interface TrendAlertDTO {
  id?: string;
  type: TrendAlertType;
  severity: TrendAlertSeverity;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  isAcknowledged: boolean;
  createdAt?: string;
}

export interface ProviderHealthDTO {
  providerId: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  successRate: number;
  lastCheckedAt?: string;
}

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface TrendConfidenceDTO {
  id?: string;
  keyword: string;
  confidenceLevel: ConfidenceLevel;
  agreeingProvidersCount: number;
  reasoning: string;
  evaluatedAt?: string;
}

export type QueueOpportunityStatus = "NEW" | "QUEUED" | "ACKNOWLEDGED" | "COMPLETED";

export interface QueuedOpportunityDTO {
  id?: string;
  title: string;
  type: string;
  targetKeyword?: string;
  businessValueScore: number;
  status: QueueOpportunityStatus;
  createdAt?: string;
}

