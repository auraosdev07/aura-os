"use server";

/**
 * services/knowledge-retrieval.ts
 *
 * Knowledge Retrieval Service for Phase 3.2 Knowledge-Aware Agent Execution.
 * Searches Knowledge Engine, calculates relevance thresholds, logs telemetry,
 * and formats context snippets for the Execution Engine.
 * Fully backed by persistent database queries (task_events & knowledge_documents).
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { searchKnowledgeEngine, createDocument, getCollections, createCollection } from "./knowledge-engine";
import type { KnowledgeSearchResult } from "@/types/knowledge-engine";

export interface RetrievedKnowledgeContext {
  documents: Array<{
    id: string;
    title: string;
    snippet: string;
    cleanContent: string;
    relevanceScore: number;
    collectionName: string;
  }>;
  highestRelevanceScore: number;
  hasSufficientKnowledge: boolean; // Score >= 0.65
  retrievalTimeMs: number;
  totalMatches: number;
}

// In-Memory Telemetry Tracker Fallback
const knowledgeTelemetryStore = {
  knowledgeHits: 0,
  knowledgeMisses: 0,
  totalRetrievalTimeMs: 0,
  retrievalCount: 0,
  documentsUsed: 0,
  knowledgeSaved: 0,
};

/**
 * Fetches Knowledge Telemetry Stats.
 * Queries PostgreSQL task_events and knowledge_documents for persistent statistics.
 */
export async function getKnowledgeTelemetryStats() {
  try {
    const { supabase } = await getServerContext();
    if (supabase && typeof supabase.from === "function") {
      const [
        { count: hitsCount },
        { count: missesCount },
        { count: savedCount },
        { data: hitEvents },
        { data: timeEvents },
      ] = await Promise.all([
        supabase.from("task_events").select("*", { count: "exact", head: true }).eq("event_type", "KNOWLEDGE_HIT"),
        supabase.from("task_events").select("*", { count: "exact", head: true }).eq("event_type", "KNOWLEDGE_MISS"),
        supabase.from("task_events").select("*", { count: "exact", head: true }).eq("event_type", "KNOWLEDGE_AUTO_SAVED"),
        supabase.from("task_events").select("details").eq("event_type", "KNOWLEDGE_HIT"),
        supabase.from("task_events").select("details").eq("event_type", "STAGE_KNOWLEDGE_RETRIEVAL"),
      ]);

      const hits = (hitsCount ?? 0) || knowledgeTelemetryStore.knowledgeHits;
      const misses = (missesCount ?? 0) || knowledgeTelemetryStore.knowledgeMisses;
      const saved = (savedCount ?? 0) || knowledgeTelemetryStore.knowledgeSaved;

      let documentsUsed = 0;
      if (hitEvents && hitEvents.length > 0) {
        for (const ev of hitEvents) {
          const details = ev.details as { documents?: unknown[] } | null;
          if (details && Array.isArray(details.documents)) {
            documentsUsed += details.documents.length;
          }
        }
      }
      if (documentsUsed === 0) documentsUsed = knowledgeTelemetryStore.documentsUsed;

      let totalTime = 0;
      let timeCount = 0;
      if (timeEvents && timeEvents.length > 0) {
        for (const ev of timeEvents) {
          const details = ev.details as { retrievalTimeMs?: number } | null;
          if (details && typeof details.retrievalTimeMs === "number") {
            totalTime += details.retrievalTimeMs;
            timeCount++;
          }
        }
      }

      const avgRetrievalTimeMs =
        timeCount > 0
          ? Math.round(totalTime / timeCount)
          : knowledgeTelemetryStore.retrievalCount > 0
          ? Math.round(knowledgeTelemetryStore.totalRetrievalTimeMs / knowledgeTelemetryStore.retrievalCount)
          : 0;

      return {
        knowledgeHits: hits,
        knowledgeMisses: misses,
        avgRetrievalTimeMs,
        documentsUsed,
        knowledgeSaved: saved,
      };
    }
  } catch {
    // Fallback if DB context is unavailable
  }

  const avgRetrievalTimeMs =
    knowledgeTelemetryStore.retrievalCount > 0
      ? Math.round(knowledgeTelemetryStore.totalRetrievalTimeMs / knowledgeTelemetryStore.retrievalCount)
      : 0;

  return {
    knowledgeHits: knowledgeTelemetryStore.knowledgeHits,
    knowledgeMisses: knowledgeTelemetryStore.knowledgeMisses,
    avgRetrievalTimeMs,
    documentsUsed: knowledgeTelemetryStore.documentsUsed,
    knowledgeSaved: knowledgeTelemetryStore.knowledgeSaved,
  };
}

/**
 * Searches Knowledge Engine for prompt-relevant context.
 * Calculates relevance score threshold (>= 0.65 is sufficient to skip web search).
 */
export async function searchRelevantKnowledge(
  taskPrompt: string,
  options?: { minRelevanceScore?: number; limit?: number }
): Promise<RetrievedKnowledgeContext> {
  const startTime = Date.now();
  const minScore = options?.minRelevanceScore ?? 0.35;
  const limit = options?.limit ?? 5;

  try {
    const rawResults: KnowledgeSearchResult[] = await searchKnowledgeEngine({
      query: taskPrompt,
      limit,
    });

    const durationMs = Date.now() - startTime;
    knowledgeTelemetryStore.totalRetrievalTimeMs += durationMs;
    knowledgeTelemetryStore.retrievalCount++;

    const filtered = rawResults.filter((r) => r.relevanceScore >= minScore);
    const highestScore = filtered.length > 0 ? filtered[0].relevanceScore : 0;
    const isSufficient = highestScore >= 0.65;

    if (isSufficient || filtered.length > 0) {
      knowledgeTelemetryStore.knowledgeHits++;
      knowledgeTelemetryStore.documentsUsed += filtered.length;
    } else {
      knowledgeTelemetryStore.knowledgeMisses++;
    }

    const formattedDocs = filtered.map((r) => ({
      id: r.document.id,
      title: r.document.title,
      snippet: r.snippet,
      cleanContent: r.document.clean_content || r.document.raw_content,
      relevanceScore: r.relevanceScore,
      collectionName: r.collection?.name || "Global Knowledge",
    }));

    return {
      documents: formattedDocs,
      highestRelevanceScore: highestScore,
      hasSufficientKnowledge: isSufficient,
      retrievalTimeMs: durationMs,
      totalMatches: filtered.length,
    };
  } catch (err) {
    console.error("[SEARCH RELEVANT KNOWLEDGE ERROR]:", err);
    return {
      documents: [],
      highestRelevanceScore: 0,
      hasSufficientKnowledge: false,
      retrievalTimeMs: Date.now() - startTime,
      totalMatches: 0,
    };
  }
}

/**
 * Automatic Learning: Auto-saves task deliverables into the Knowledge Engine
 * so future agents can reuse knowledge.
 */
export async function autoSaveTaskKnowledge(params: {
  taskId: string;
  taskTitle: string;
  agentRole: string;
  summary: string;
  output: string;
}): Promise<void> {
  try {
    // 1. Ensure system collection exists
    const collections = await getCollections();
    let systemColl = collections.find((c) => c.name === "Task Deliverables & Operational Knowledge");

    if (!systemColl) {
      systemColl = await createCollection({
        name: "Task Deliverables & Operational Knowledge",
        description: "Auto-saved task execution outputs and operational deliverables for future agent reuse.",
        type: "DOCUMENTATION",
        tags: ["auto_saved", "task_outputs", "system"],
      });
    }

    // 2. Save Knowledge Document
    await createDocument({
      collectionId: systemColl.id,
      title: `Task Output: ${params.taskTitle}`,
      source: `Task Execution Engine (Task ID: ${params.taskId})`,
      rawContent: `Title: ${params.taskTitle}\nRole: ${params.agentRole}\n\nSummary:\n${params.summary}\n\nDeliverable Output:\n${params.output}`,
      summary: params.summary,
      tags: ["auto_learned", "task_output", params.agentRole],
      language: "en",
    });

    knowledgeTelemetryStore.knowledgeSaved++;
  } catch (err) {
    console.error("[AUTO SAVE TASK KNOWLEDGE ERROR]:", err);
  }
}
