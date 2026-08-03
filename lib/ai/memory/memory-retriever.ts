/**
 * lib/ai/memory/memory-retriever.ts
 *
 * Formats and retrieves relevant long-term memories to inject into LLM context.
 */

import type { MemoryItem } from "./memory-types";
import { searchMemoryStore } from "./memory-store";

/**
 * Pre-filter retrieved memories:
 * 1. Remove duplicate content (case-insensitive deduplication).
 * 2. Ignore low-importance memories (< 5).
 * 3. Rank by importance (descending) and recency (descending).
 */
export function filterAndRankMemories(memories: MemoryItem[]): MemoryItem[] {
  if (!memories || memories.length === 0) return [];

  const seenContent = new Set<string>();
  const filtered: MemoryItem[] = [];

  for (const item of memories) {
    if (item.importance < 5) continue;
    const normalized = item.content.toLowerCase().trim();
    if (seenContent.has(normalized)) continue;
    seenContent.add(normalized);
    filtered.push(item);
  }

  return filtered.sort((a, b) => {
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function retrieveMemoryContext(options: {
  ownerId: string;
  query: string;
  limit?: number;
}): Promise<{ formattedContext: string; totalMemories: number; rawMemories: MemoryItem[] }> {
  const rawMemories = await searchMemoryStore({
    ownerId: options.ownerId,
    query: options.query,
    limit: options.limit || 5,
    similarityThreshold: 0.3,
  });

  const memories = filterAndRankMemories(rawMemories);

  if (!memories || memories.length === 0) {
    return { formattedContext: "", totalMemories: 0, rawMemories: [] };
  }

  const lines = memories.map(
    (m) => `- [${m.type.toUpperCase()}] (id: ${m.id}) ${m.content} (Importance: ${m.importance}/10)`
  );

  const formattedContext = `### Remembered User Context & Facts\n${lines.join("\n")}`;
  return {
    formattedContext,
    totalMemories: memories.length,
    rawMemories: memories,
  };
}
