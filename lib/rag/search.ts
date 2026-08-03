/**
 * lib/rag/search.ts
 *
 * Vector similarity search engine querying knowledge_chunks via Supabase RPC.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
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
  try {
    let supabase: SupabaseClient;
    let user: { id: string };

    if (options.clientOverride) {
      supabase = options.clientOverride;
      user = { id: options.ownerId || options.userIdOverride || "dev-owner-id" };
    } else {
      const ctx = await getServerContext();
      supabase = ctx.supabase;
      user = ctx.user;
    }

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
    const rpcParams = {
      query_embedding: queryVector,
      match_threshold: options.threshold ?? 0.0,
      match_count: options.limit ?? 10,
      filter_owner_id: options.ownerId || user.id,
      filter_layer: options.layer || null,
      filter_mission_id: options.missionId || null,
    };

    const { data, error } = await supabase.rpc("match_knowledge_chunks", rpcParams);

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
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[SEARCH KNOWLEDGE FAILURE]:", err);
    }
    throw err;
  }
}
