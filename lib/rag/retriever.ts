/**
 * lib/rag/retriever.ts
 *
 * RAG Context Retrieval Engine.
 * Deduplicates, filters by threshold/token budgets, and formats retrieved knowledge context.
 */

import { searchKnowledge } from "./search";
import type { RetrievalOptions, RetrievedContext, VectorSearchResult } from "./types";

const DEFAULT_LIMIT = 5;
const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_MAX_TOKENS = 2000;

/**
 * Retrieve relevant knowledge chunks and assemble prompt-ready formatted context.
 */
export async function retrieveContext(
  options: RetrievalOptions
): Promise<RetrievedContext> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  // 1. Search vector similarity
  const searchResults = await searchKnowledge({
    query: options.query,
    limit: limit * 2, // Fetch extra candidate pool for deduplication
    threshold,
    layer: options.layer,
    missionId: options.missionId,
  });

  // 2. Remove duplicate chunks by ID and identical content
  const seenIds = new Set<string>();
  const seenContents = new Set<string>();
  const uniqueChunks: VectorSearchResult[] = [];

  for (const chunk of searchResults) {
    const trimmedContent = chunk.content.trim();
    if (seenIds.has(chunk.id) || seenContents.has(trimmedContent)) {
      continue;
    }
    seenIds.add(chunk.id);
    seenContents.add(trimmedContent);
    uniqueChunks.push(chunk);
  }

  // 3. Select chunks respecting maximum context token budget
  const selectedChunks: VectorSearchResult[] = [];
  let totalTokens = 0;

  for (const chunk of uniqueChunks) {
    if (selectedChunks.length >= limit) break;

    const chunkTokens = chunk.tokenCount || Math.max(1, Math.ceil(chunk.content.length / 4));
    if (totalTokens + chunkTokens > maxTokens && selectedChunks.length > 0) {
      break;
    }

    selectedChunks.push(chunk);
    totalTokens += chunkTokens;
  }

  // 4. Format output into structured Markdown context block
  const formattedContext = formatRetrievedContext(selectedChunks);

  return {
    formattedContext,
    chunks: selectedChunks,
    totalTokens,
  };
}

function formatRetrievedContext(chunks: VectorSearchResult[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const sections = chunks.map((chunk) => {
    const title = String(chunk.metadata.title || chunk.metadata.filename || "Knowledge Document");
    const layer = chunk.metadata.layer ? ` (Layer: ${chunk.metadata.layer})` : "";
    const sourceHeader = `[Source: ${title}${layer}]`;

    return `${sourceHeader}\n${chunk.content}`;
  });

  return `### Relevant Knowledge\n\n${sections.join("\n\n")}`;
}
