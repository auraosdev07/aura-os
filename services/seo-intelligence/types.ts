/**
 * services/seo-intelligence/types.ts
 *
 * Types, Provider Contracts, and Telemetry Data Models for Phase 4B.2.
 */

export type ProviderSourceType =
  | "PUBLIC_API"
  | "PUBLIC_SCRAPE"
  | "COMMUNITY_SERP"
  | "CSV_IMPORT"
  | "FIRST_PARTY_API";

export type ProviderSignalType =
  | "SUGGESTION"
  | "QUESTION"
  | "SERP_ITEM"
  | "COMMUNITY_POST"
  | "RELATED_SEARCH"
  | "METRIC_RECORD";

export interface ProviderSignal {
  type: ProviderSignalType;
  text: string;
  url?: string;
  metadata?: Record<string, any>;
  sourceName: string;
  sourceType: ProviderSourceType;
  sourceTrust: number; // 0.0 to 1.0
  sourceTimestamp: string;
}

export type ProviderStatus = "HEALTHY" | "DEGRADED" | "DISABLED" | "BLOCKED";

export interface ProviderHealthRecord {
  providerId: string;
  providerName: string;
  lastRun: string;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageResponseMs: number;
  lastError?: string;
  status: ProviderStatus;
  blockedUntil?: string;
}

export interface SEOIntelligenceProvider {
  id: string;
  name: string;
  priority: number; // Lower number = higher priority
  sourceType: ProviderSourceType;
  trustScore: number; // Provider trust weighting (0.0 to 1.0)
  isEnabled(): Promise<boolean>;
  collectSignals(keyword: string, country: string): Promise<ProviderSignal[]>;
}

export type SEOIntent = "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL";

export type EntityType = "brand" | "product" | "material" | "location" | "attribute" | "synonym";

export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  sources: string[];
}

export interface SignalModifiers {
  searchModifiers: string[];
  commercialModifiers: string[];
  geoModifiers: string[];
  questionModifiers: string[];
  comparisonModifiers: string[];
  priceModifiers: string[];
  audienceModifiers: string[];
  urgencyModifiers: string[];
}

export interface MinedInsights {
  brandMentions: string[];
  competitorMentions: string[];
  painPoints: string[];
  benefits: string[];
  objections: string[];
  useCases: string[];
  targetAudience: string[];
  contentAngles: string[];
  contentFormats: string[];
}

export interface SEOIntelligenceReport {
  id?: string;
  keyword: string;
  normalizedKeyword: string;
  country: string;
  intent: SEOIntent;
  intentConfidence: number;
  activeProviders: string[];
  totalSignalsCollected: number;
  suggestions: ProviderSignal[];
  questions: ProviderSignal[];
  relatedSearches: ProviderSignal[];
  communityDiscussions: ProviderSignal[];
  serpSnapshot: ProviderSignal[];
  modifiers: SignalModifiers;
  extractedEntities: ExtractedEntity[];
  minedInsights: MinedInsights;
  knowledgeDocumentId?: string;
  createdAt: string;
  updatedAt: string;
  isCached?: boolean;
}
