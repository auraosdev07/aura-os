/**
 * services/collectors/types.ts
 *
 * Universal Data Collector Abstraction Layer Types (Phase 4A Module 6).
 */

export type CollectorSourceType =
  | "WEBSITE"
  | "PDF"
  | "MARKDOWN"
  | "RSS"
  | "XML"
  | "CSV"
  | "GITHUB"
  | "NOTION"
  | "DOCUMENTATION";

export interface CollectionParams {
  target: string;
  maxDepth?: number;
  maxItems?: number;
  options?: Record<string, unknown>;
}

export interface CollectedItem {
  id: string;
  title: string;
  sourceUrl: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface CollectionResult {
  sourceType: CollectorSourceType;
  target: string;
  itemCount: number;
  items: CollectedItem[];
  executionTimeMs: number;
}

export interface DataCollector {
  sourceType: CollectorSourceType;
  collect(params: CollectionParams): Promise<CollectionResult>;
}
