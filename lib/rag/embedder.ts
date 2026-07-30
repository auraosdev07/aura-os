/**
 * lib/rag/embedder.ts
 *
 * Batch embedder for RAG chunks leveraging lib/ai/client embed() facade.
 */

import { embed as aiEmbed } from "@/lib/ai/client";
import type { ChunkItem, EmbeddingResult, BatchEmbeddingResult } from "./types";

const BATCH_SIZE = 16;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/**
 * Generate embeddings for an array of ChunkItems in sequential batches of 16 (Concurrency = 1).
 * Preserves original input order and retries transient failures with exponential backoff.
 */
export async function embedChunks(chunks: ChunkItem[]): Promise<EmbeddingResult[]> {
  if (chunks.length === 0) return [];

  const results: EmbeddingResult[] = new Array(chunks.length);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    const rawEmbeddings = await retryWithExponentialBackoff(() => aiEmbed(texts));

    const vectorList: number[][] = Array.isArray(rawEmbeddings[0])
      ? (rawEmbeddings as number[][])
      : ([rawEmbeddings] as number[][]);

    batch.forEach((chunk, batchIdx) => {
      const globalIdx = i + batchIdx;
      const embedding = vectorList[batchIdx] || new Array(768).fill(0);
      results[globalIdx] = {
        chunkIndex: chunk.chunkIndex,
        embedding,
      };
    });
  }

  return results;
}

/**
 * Generate embeddings for raw text strings in sequential batches of 16.
 */
export async function embedTexts(texts: string[]): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) return { embeddings: [] };

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const rawEmbeddings = await retryWithExponentialBackoff(() => aiEmbed(batch));

    const vectorList: number[][] = Array.isArray(rawEmbeddings[0])
      ? (rawEmbeddings as number[][])
      : ([rawEmbeddings] as number[][]);

    allEmbeddings.push(...vectorList);
  }

  return { embeddings: allEmbeddings };
}

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_BACKOFF_MS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
  }
}
