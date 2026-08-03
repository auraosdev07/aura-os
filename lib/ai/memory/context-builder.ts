/**
 * lib/ai/memory/context-builder.ts
 *
 * Production-ready Unified Context Builder for Aura OS.
 * Parallelizes RAG and Memory retrievals, enforces strict token budgets,
 * deduplicates context elements, and returns a unified context package.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIMessage } from "@/lib/ai/types";
import { retrieveContext } from "@/lib/rag/retriever";
import { searchMemoryStore } from "./memory-store";
import { getConversationSummary, getConversationMessages } from "@/lib/db/queries";
import type { MemoryItem } from "./memory-types";

export interface TokenBudgets {
  system?: number;       // default 500
  rag?: number;          // default 1000
  memory?: number;       // default 600
  conversation?: number; // default 900
}

export interface BuildContextOptions {
  ownerId: string;
  query: string;
  messages: AIMessage[];
  conversationId?: string;
  supabaseOverride?: SupabaseClient;
  tokenBudgets?: TokenBudgets;
}

export interface UnifiedContextPackage {
  systemContext: string;
  ragContext: string;
  memoryContext: string;
  conversationContext: string;
  summaryContext: string;
  userPrompt: string;
  formattedSystemPrompt: string;
  messages: AIMessage[];
  stats: {
    ragChunks: number;
    memoryCount: number;
    hasSummary: boolean;
    totalTokens: number;
  };
}

const DEFAULT_BUDGETS: Required<TokenBudgets> = {
  system: 500,
  rag: 1000,
  memory: 600,
  conversation: 900,
};

function estimateTokens(str: string): number {
  if (!str) return 0;
  return Math.max(1, Math.ceil(str.length / 4));
}

function truncateToTokenBudget(text: string, maxTokens: number): string {
  if (!text || maxTokens <= 0) return "";
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;
  const maxChars = maxTokens * 4;
  return text.substring(0, maxChars) + "\n...[truncated]";
}

/**
 * Assembles the complete AI context before every response.
 * Executes RAG and Memory retrievals in parallel via Promise.all().
 */
export async function buildUnifiedContextPackage(
  options: BuildContextOptions
): Promise<UnifiedContextPackage> {
  const {
    ownerId,
    query,
    messages,
    conversationId,
    supabaseOverride,
    tokenBudgets: customBudgets,
  } = options;

  const budgets = { ...DEFAULT_BUDGETS, ...customBudgets };
  const userPrompt = query.trim();

  // 1. Parallel Retrieval of RAG, User Memories, and Thread Summary
  const [ragResult, memoryResult, summaryRow, recentMsgRows] = await Promise.all([
    userPrompt
      ? retrieveContext({
          query: userPrompt,
          maxTokens: budgets.rag,
          threshold: 0.3,
          clientOverride: supabaseOverride,
          userIdOverride: ownerId,
        }).catch(() => ({ chunks: [], formattedContext: "", totalTokens: 0 }))
      : Promise.resolve({ chunks: [], formattedContext: "", totalTokens: 0 }),

    userPrompt
      ? searchMemoryStore({
          ownerId,
          query: userPrompt,
          limit: 10,
          similarityThreshold: 0.1,
          clientOverride: supabaseOverride,
        }).catch(() => [] as MemoryItem[])
      : Promise.resolve([] as MemoryItem[]),

    conversationId && supabaseOverride
      ? getConversationSummary(supabaseOverride, conversationId).catch(() => null)
      : Promise.resolve(null),

    conversationId && supabaseOverride
      ? getConversationMessages(supabaseOverride, conversationId).catch(() => [])
      : Promise.resolve([]),
  ]);

  // 2. Format RAG Context
  let ragContext = "";
  if (ragResult.formattedContext && ragResult.chunks.length > 0) {
    ragContext = truncateToTokenBudget(ragResult.formattedContext, budgets.rag);
  }

  // 3. Format Memory Context (Deduplicated & Ranked)
  let memoryContext = "";
  const uniqueMemories: MemoryItem[] = [];
  const seenMemContent = new Set<string>();

  for (const mem of memoryResult) {
    const trimmed = mem.content.trim().toLowerCase();
    if (!seenMemContent.has(trimmed)) {
      seenMemContent.add(trimmed);
      uniqueMemories.push(mem);
    }
  }

  if (uniqueMemories.length > 0) {
    const memLines = uniqueMemories.map(
      (m, idx) => `[Memory ${idx + 1}] (${m.type.toUpperCase()}, Importance ${m.importance}/10): ${m.content}`
    );
    const rawMemBlock = `=== USER MEMORIES & PREFERENCES ===\n${memLines.join("\n")}`;
    memoryContext = truncateToTokenBudget(rawMemBlock, budgets.memory);
  }

  // 4. Format Thread Summary Context
  let summaryContext = "";
  if (summaryRow && summaryRow.summary_text) {
    summaryContext = `=== THREAD SUMMARY ===\n${summaryRow.summary_text}`;
  }

  // 5. Format Conversation History Context
  let conversationContext = "";
  if (recentMsgRows.length > 0) {
    const recentTurns = recentMsgRows
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
    conversationContext = truncateToTokenBudget(
      `=== RECENT CONVERSATION HISTORY ===\n${recentTurns}`,
      budgets.conversation
    );
  }

  // 6. Base System Context
  const existingSysMsg = messages.find((m) => m.role === "system")?.content || "";
  const baseSystemPrompt = existingSysMsg || "You are Aura OS AI, an intelligent operations workspace assistant.";
  const systemContext = truncateToTokenBudget(baseSystemPrompt, budgets.system);

  // 7. Combine system prompt with all context blocks
  const systemSections = [
    systemContext,
    summaryContext,
    memoryContext,
    ragContext,
    conversationContext,
  ].filter(Boolean);

  const formattedSystemPrompt = systemSections.join("\n\n");

  // 8. Reconstruct updated messages array with unified system prompt
  const updatedMessages: AIMessage[] = [...messages];
  const sysIndex = updatedMessages.findIndex((m) => m.role === "system");

  if (sysIndex !== -1) {
    updatedMessages[sysIndex] = {
      ...updatedMessages[sysIndex],
      content: formattedSystemPrompt,
    };
  } else {
    updatedMessages.unshift({
      role: "system",
      content: formattedSystemPrompt,
    });
  }

  const totalTokens =
    estimateTokens(formattedSystemPrompt) + estimateTokens(userPrompt);

  return {
    systemContext,
    ragContext,
    memoryContext,
    conversationContext,
    summaryContext,
    userPrompt,
    formattedSystemPrompt,
    messages: updatedMessages,
    stats: {
      ragChunks: ragResult.chunks.length,
      memoryCount: uniqueMemories.length,
      hasSummary: Boolean(summaryRow),
      totalTokens,
    },
  };
}
