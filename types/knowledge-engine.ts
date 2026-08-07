/**
 * types/knowledge-engine.ts
 *
 * Single Source of Truth for Universal Knowledge Engine Types (Phase 3.1).
 */

export type KnowledgeCollectionType =
  | "WEBSITE"
  | "PRODUCT_CATALOG"
  | "BLOG"
  | "DOCUMENTATION"
  | "PDF"
  | "MARKDOWN"
  | "URL"
  | "NOTES"
  | "FAQS"
  | "POLICIES";

export type KnowledgeCollectionStatus =
  | "ACTIVE"
  | "PROCESSING"
  | "SYNCING"
  | "ARCHIVED"
  | "ERROR";

export type KnowledgeDocumentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "ARCHIVED";

export interface KnowledgeCollectionRow {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  type: KnowledgeCollectionType;
  status: KnowledgeCollectionStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocumentRow {
  id: string;
  collection_id: string | null;
  owner_id: string | null;
  title: string;
  source: string | null;
  raw_content: string;
  clean_content: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  hash: string | null;
  status: KnowledgeDocumentStatus;
  language: string;
  tokens: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSearchFilters {
  query?: string;
  collectionId?: string;
  type?: KnowledgeCollectionType;
  status?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface KnowledgeSearchResult {
  document: KnowledgeDocumentRow;
  collection?: KnowledgeCollectionRow | null;
  relevanceScore: number; // 0.0 to 1.0
  snippet: string;
  matchedTerms: string[];
}

export interface KnowledgeEngineStats {
  totalCollections: number;
  totalDocuments: number;
  totalTokens: number;
  collectionTypeCounts: Record<KnowledgeCollectionType, number>;
  documentStatusCounts: Record<KnowledgeDocumentStatus, number>;
  recentImports: KnowledgeDocumentRow[];
}

export interface CreateKnowledgeCollectionInput {
  name: string;
  description?: string;
  type: KnowledgeCollectionType;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateKnowledgeDocumentInput {
  collectionId?: string;
  title: string;
  source?: string;
  rawContent: string;
  cleanContent?: string;
  summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  language?: string;
}
