/**
 * lib/ai/memory/memory-types.ts
 *
 * Core type contracts for the Aura OS Long-Term Memory System.
 */

export type MemoryType =
  | "conversation"
  | "fact"
  | "preference"
  | "mission"
  | "knowledge_reference";

export interface MemoryItem {
  id: string;
  ownerId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  importance: number; // 1-10
  createdAt: string;
  updatedAt: string;
  sourceConversationId?: string;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export interface WriteMemoryInput {
  ownerId: string;
  type: MemoryType;
  content: string;
  importance: number;
  sourceConversationId?: string;
  clientOverride?: SupabaseClient;
}

export interface RetrieveMemoryOptions {
  ownerId: string;
  type?: MemoryType;
  limit?: number;
  minImportance?: number;
}

export interface SearchMemoryOptions {
  ownerId: string;
  query: string;
  type?: MemoryType;
  limit?: number;
  similarityThreshold?: number;
}
