/**
 * lib/rag/types.ts
 *
 * Core TypeScript interfaces for RAG Chunking and Embedding layer.
 */

export interface ChunkMetadata {
  sourceId: string;
  sourceType: "knowledge_entry" | "artifact";
  title: string;
  ownerId: string;
  layer?: string;
  missionId?: string | null;
  employeeId?: string | null;
  filename?: string;
  mimeType?: string;
  [key: string]: unknown;
}

export interface ChunkItem {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: ChunkMetadata;
}

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface EmbeddingResult {
  chunkIndex: number;
  embedding: number[];
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens?: number;
}
