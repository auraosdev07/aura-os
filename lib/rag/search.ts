/**
 * lib/rag/search.ts
 *
 * Vector similarity search engine querying knowledge_chunks via Supabase RPC.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { embedTexts } from "./embedder";
import type { VectorSearchOptions, VectorSearchResult } from "./types";

interface RpcChunkRow {
  id: string;
  owner_id: string;
  knowledge_id: string | null;
  artifact_id: string | null;
  chunk_index: number;
  content: string;
  token_count: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Execute vector similarity search over indexed knowledge_chunks using Cosine distance.
 */
export async function searchKnowledge(
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const { user, supabase } = await getServerContext();

  if (!options.query || options.query.trim().length === 0) {
    return [];
  }

  // 1. Generate vector embedding for the search query
  const { embeddings } = await embedTexts([options.query.trim()]);
  const queryVector = embeddings[0];

  if (!queryVector || queryVector.length === 0) {
    return [];
  }

  // 2. Query Supabase match_knowledge_chunks RPC
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: queryVector,
    match_threshold: options.threshold ?? 0.0,
    match_count: options.limit ?? 10,
    filter_owner_id: options.ownerId || user.id,
    filter_layer: options.layer || null,
    filter_mission_id: options.missionId || null,
  });

  if (error) {
    console.error("[RAG VECTOR SEARCH ERROR] RPC match_knowledge_chunks failed:", error);
    throw error;
  }

  const rows = (data || []) as RpcChunkRow[];

  // 3. Map and return similarity-ordered results
  return rows.map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    knowledgeId: row.knowledge_id,
    artifactId: row.artifact_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    tokenCount: row.token_count,
    metadata: row.metadata || {},
    similarity: row.similarity,
  }));
}
