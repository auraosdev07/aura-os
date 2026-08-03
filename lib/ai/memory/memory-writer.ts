/**
 * lib/ai/memory/memory-writer.ts
 *
 * Automatic Long-Term Memory Extraction & Consolidation Subsystem.
 * Runs asynchronously post-turn without blocking streaming responses.
 * Uses LLM to extract durable facts/preferences, performs vector deduplication,
 * and consolidates matching memories.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateJSON } from "@/lib/ai/client";
import { writeMemoryStore, searchMemoryStore } from "./memory-store";
import { incrementMemoryAccessCount, updateUserMemory } from "@/lib/db/mutations";
import type { MemoryType } from "./memory-types";

export interface ExtractedMemoryItem {
  type: MemoryType;
  content: string;
  importance: number; // 1 - 10
  category?: string;
}

export interface ExtractionResult {
  extracted: ExtractedMemoryItem[];
  inserted: ExtractedMemoryItem[];
  merged: ExtractedMemoryItem[];
  ignoredCount: number;
}

const EXTRACTION_SYSTEM_PROMPT = `You are the Long-Term Memory Extraction Engine for Aura OS.
Analyze the user interaction turn and extract ONLY durable, long-term operational memories.

CRITICAL EXTRACTION RULES:
1. Extract ONLY:
   - User preferences (e.g. tech stack, UI layout, coding conventions)
   - Permanent business facts / company details
   - Long-term goals & strategic decisions
   - Ongoing projects & active mission states
   - Recurring operational workflows
   - Unfinished tasks / TODOs for future turns

2. IGNORE and DO NOT EXTRACT:
   - Greetings (hi, hello, thanks, bye)
   - One-time factual questions (e.g. "what is the capital of France?")
   - Temporary debugging text or transient status checks
   - General conversation filler

3. Assign importance score (1 to 10):
   - 10: Core preference, permanent architecture decision, critical workflow
   - 8-9: Active project state, important business fact, explicit user instruction
   - 6-7: Operational detail, secondary preference
   - 1-5: Ignore / do not extract

Return JSON format:
{
  "memories": [
    {
      "type": "preference" | "fact" | "decision" | "project_state" | "unfinished_work",
      "content": "Clear, standalone memory statement",
      "importance": number
    }
  ]
}`;

/**
 * Asynchronously inspects user turn and assistant response post-stream,
 * extracts durable memories via LLM, and consolidates duplicates into user_memories.
 */
export async function evaluateAndWriteMemory(options: {
  ownerId: string;
  userQuery: string;
  assistantResponse: string;
  conversationId?: string;
  clientOverride?: SupabaseClient;
}): Promise<ExtractionResult> {
  const { ownerId, userQuery, assistantResponse, conversationId, clientOverride } = options;

  const result: ExtractionResult = {
    extracted: [],
    inserted: [],
    merged: [],
    ignoredCount: 0,
  };

  // Quick pre-filter: Skip short greetings and empty queries
  const lowerQuery = userQuery.toLowerCase().trim();
  const trivialGreetings = ["hi", "hello", "hey", "thanks", "thank you", "good morning", "bye"];
  if (trivialGreetings.includes(lowerQuery) || lowerQuery.length < 5) {
    result.ignoredCount++;
    return result;
  }

  try {
    // 1. LLM Extraction Call
    const llmRes = await generateJSON<{ memories: ExtractedMemoryItem[] }>({
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `[USER QUERY]: "${userQuery}"\n[ASSISTANT RESPONSE]: "${assistantResponse.substring(0, 500)}"`,
        },
      ],
      temperature: 0.2,
    });

    const candidateMemories = llmRes?.memories || [];
    const validMemories = candidateMemories.filter(
      (m) => m.content && m.importance >= 6 && m.content.length >= 8
    );

    result.extracted = validMemories;

    if (validMemories.length === 0) {
      return result;
    }

    // 2. Duplicate Detection & Memory Consolidation Loop
    for (const item of validMemories) {
      const existingMatches = await searchMemoryStore({
        ownerId,
        query: item.content,
        limit: 3,
        similarityThreshold: 0.80,
        clientOverride,
      });

      if (existingMatches && existingMatches.length > 0) {
        const topMatch = existingMatches[0];

        // CONSOLIDATION ALGORITHM:
        // Update existing memory: increment access count, increase importance, and update last_accessed_at
        const newImportance = Math.min(10, Math.max(topMatch.importance, item.importance) + 1);

        if (clientOverride) {
          await incrementMemoryAccessCount(clientOverride, topMatch.id, ownerId);
          await updateUserMemory(clientOverride, topMatch.id, ownerId, {
            importance: newImportance,
          });
        }

        result.merged.push({
          type: item.type,
          content: `${topMatch.content} (Merged & Reinforced -> Importance: ${newImportance})`,
          importance: newImportance,
        });
      } else {
        // INSERT NEW MEMORY
        await writeMemoryStore({
          ownerId,
          type: item.type,
          content: item.content,
          importance: item.importance,
          sourceConversationId: conversationId,
          clientOverride,
        });

        result.inserted.push(item);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[MEMORY EXTRACTION WARNING]: Failed to extract/write memory:", err);
    }
  }

  return result;
}
