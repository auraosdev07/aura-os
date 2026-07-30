"use server";

/**
 * services/rag.ts
 *
 * RAG Knowledge Indexing Service.
 * Connects Document Extraction, Chunking, Embedding, and Bulk DB Insertion.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { getKnowledgeEntryById, getArtifactById } from "@/lib/db/queries";
import {
  insertKnowledgeChunks,
  deleteKnowledgeChunksByKnowledgeId,
  deleteKnowledgeChunksByArtifactId,
} from "@/lib/db/mutations";
import { extractorRegistry } from "@/lib/rag/extractors/registry";
import { chunkText } from "@/lib/rag/chunker";
import { embedChunks } from "@/lib/rag/embedder";
import type { ChunkMetadata } from "@/lib/rag/types";
import type { KnowledgeChunkInsert } from "@/types/database";

const ARTIFACT_BUCKET_NAME = "artifacts";

export interface IndexingStats {
  sourceId: string;
  sourceType: "knowledge_entry" | "artifact";
  chunkCount: number;
  tokenCount: number;
  elapsedTimeMs: number;
}

/**
 * Extract, chunk, embed, and bulk insert a Knowledge Entry into knowledge_chunks.
 * Atomically replaces any previous index for this entry.
 */
export async function indexKnowledge(knowledgeId: string): Promise<IndexingStats> {
  const startTime = Date.now();
  const { user, supabase } = await getServerContext();

  try {
    // 1. Fetch source data
    let entry;
    try {
      entry = await getKnowledgeEntryById(supabase, knowledgeId);
    } catch {
      entry = null;
    }

    if (!entry || entry.deleted_at || entry.owner_id !== user.id) {
      await deleteKnowledgeChunksByKnowledgeId(supabase, knowledgeId, user.id);
      return {
        sourceId: knowledgeId,
        sourceType: "knowledge_entry",
        chunkCount: 0,
        tokenCount: 0,
        elapsedTimeMs: Date.now() - startTime,
      };
    }

    // 2. Resolve extractor & Extract text
    const filename = `${entry.title}.md`;
    const mimeType = "text/markdown";
    const extractor = extractorRegistry.getExtractor(mimeType, filename);

    const baseMetadata: ChunkMetadata = {
      sourceId: knowledgeId,
      sourceType: "knowledge_entry",
      title: entry.title,
      ownerId: user.id,
      layer: entry.layer,
      missionId: entry.mission_id,
      employeeId: entry.employee_id,
      filename,
      mimeType,
    };

    const extracted = await extractor.extract(entry.content, baseMetadata);

    // 3. Chunk text
    const chunks = chunkText(extracted.text, extracted.metadata);

    if (chunks.length === 0) {
      await deleteKnowledgeChunksByKnowledgeId(supabase, knowledgeId, user.id);
      return {
        sourceId: knowledgeId,
        sourceType: "knowledge_entry",
        chunkCount: 0,
        tokenCount: 0,
        elapsedTimeMs: Date.now() - startTime,
      };
    }

    // 4. Batch Embed chunks
    const embeddedResults = await embedChunks(chunks);

    // 5. Delete previous chunks & Bulk insert new chunks
    await deleteKnowledgeChunksByKnowledgeId(supabase, knowledgeId, user.id);

    const chunkRows: KnowledgeChunkInsert[] = chunks.map((chunk, idx) => ({
      owner_id: user.id,
      knowledge_id: knowledgeId,
      artifact_id: null,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      token_count: chunk.tokenCount,
      metadata: chunk.metadata,
      embedding: embeddedResults[idx]?.embedding || new Array(768).fill(0),
    }));

    await insertKnowledgeChunks(supabase, chunkRows);

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);

    return {
      sourceId: knowledgeId,
      sourceType: "knowledge_entry",
      chunkCount: chunks.length,
      tokenCount: totalTokens,
      elapsedTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[RAG INDEXING FAILURE] indexKnowledge failed for ${knowledgeId}:`, error);
    return {
      sourceId: knowledgeId,
      sourceType: "knowledge_entry",
      chunkCount: 0,
      tokenCount: 0,
      elapsedTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Extract, chunk, embed, and bulk insert an Artifact into knowledge_chunks.
 * Atomically replaces any previous index for this artifact.
 */
export async function indexArtifact(artifactId: string): Promise<IndexingStats> {
  const startTime = Date.now();
  const { user, supabase } = await getServerContext();

  try {
    // 1. Fetch source data
    let artifact;
    try {
      artifact = await getArtifactById(supabase, artifactId, user.id);
    } catch {
      artifact = null;
    }

    if (!artifact || artifact.deleted_at) {
      await deleteKnowledgeChunksByArtifactId(supabase, artifactId, user.id);
      return {
        sourceId: artifactId,
        sourceType: "artifact",
        chunkCount: 0,
        tokenCount: 0,
        elapsedTimeMs: Date.now() - startTime,
      };
    }

    const filename = artifact.name || "artifact";
    const mimeType = artifact.mime_type || "";

    // Check if file type is supported by Extractor Registry (.txt, .md, .json, .csv, .log)
    if (!extractorRegistry.isSupported(mimeType, filename)) {
      await deleteKnowledgeChunksByArtifactId(supabase, artifactId, user.id);
      return {
        sourceId: artifactId,
        sourceType: "artifact",
        chunkCount: 0,
        tokenCount: 0,
        elapsedTimeMs: Date.now() - startTime,
      };
    }

    // Download file content from Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(ARTIFACT_BUCKET_NAME)
      .download(artifact.storage_path);

    if (downloadError || !fileBlob) {
      console.error(`[RAG STORAGE ERROR] Failed to download artifact (${artifact.storage_path}):`, downloadError);
      return {
        sourceId: artifactId,
        sourceType: "artifact",
        chunkCount: 0,
        tokenCount: 0,
        elapsedTimeMs: Date.now() - startTime,
      };
    }

    const arrayBuffer = await fileBlob.arrayBuffer();

    // 2. Resolve extractor & Extract text
    const extractor = extractorRegistry.getExtractor(mimeType, filename);

    const baseMetadata: ChunkMetadata = {
      sourceId: artifactId,
      sourceType: "artifact",
      title: artifact.name,
      filename,
      mimeType,
      ownerId: user.id,
      missionId: artifact.mission_id,
      employeeId: artifact.employee_id,
      knowledgeId: artifact.knowledge_id,
    };

    const extracted = await extractor.extract(arrayBuffer, baseMetadata);

    // 3. Chunk text
    const chunks = chunkText(extracted.text, extracted.metadata);

    if (chunks.length === 0) {
      await deleteKnowledgeChunksByArtifactId(supabase, artifactId, user.id);
      return {
        sourceId: artifactId,
        sourceType: "artifact",
        chunkCount: 0,
        tokenCount: 0,
        elapsedTimeMs: Date.now() - startTime,
      };
    }

    // 4. Batch Embed chunks
    const embeddedResults = await embedChunks(chunks);

    // 5. Delete previous chunks & Bulk insert new chunks
    await deleteKnowledgeChunksByArtifactId(supabase, artifactId, user.id);

    const chunkRows: KnowledgeChunkInsert[] = chunks.map((chunk, idx) => ({
      owner_id: user.id,
      knowledge_id: null,
      artifact_id: artifactId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      token_count: chunk.tokenCount,
      metadata: chunk.metadata,
      embedding: embeddedResults[idx]?.embedding || new Array(768).fill(0),
    }));

    await insertKnowledgeChunks(supabase, chunkRows);

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);

    return {
      sourceId: artifactId,
      sourceType: "artifact",
      chunkCount: chunks.length,
      tokenCount: totalTokens,
      elapsedTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[RAG INDEXING FAILURE] indexArtifact failed for ${artifactId}:`, error);
    return {
      sourceId: artifactId,
      sourceType: "artifact",
      chunkCount: 0,
      tokenCount: 0,
      elapsedTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Remove all indexed chunks for a Knowledge Entry.
 */
export async function deleteKnowledgeIndex(knowledgeId: string): Promise<void> {
  try {
    const { user, supabase } = await getServerContext();
    await deleteKnowledgeChunksByKnowledgeId(supabase, knowledgeId, user.id);
  } catch (error) {
    console.error(`[RAG INDEX DELETION FAILURE] deleteKnowledgeIndex failed for ${knowledgeId}:`, error);
  }
}

/**
 * Remove all indexed chunks for an Artifact.
 */
export async function deleteArtifactIndex(artifactId: string): Promise<void> {
  try {
    const { user, supabase } = await getServerContext();
    await deleteKnowledgeChunksByArtifactId(supabase, artifactId, user.id);
  } catch (error) {
    console.error(`[RAG INDEX DELETION FAILURE] deleteArtifactIndex failed for ${artifactId}:`, error);
  }
}
