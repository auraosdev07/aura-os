/**
 * lib/ai/memory/memory-store.ts
 *
 * Database-backed persistent memory store with owner isolation.
 * Connects directly to Supabase user_memories table and vector RPCs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerContext } from "@/lib/auth/get-server-context";
import { getUserMemories } from "@/lib/db/queries";
import { insertUserMemory, updateUserMemory } from "@/lib/db/mutations";
import { embedTexts } from "@/lib/rag/embedder";
import type {
  MemoryItem,
  MemoryType,
  WriteMemoryInput,
  RetrieveMemoryOptions,
  SearchMemoryOptions,
} from "./memory-types";

interface RpcMemoryRow {
  id: string;
  owner_id: string;
  type: MemoryType;
  content: string;
  importance: number;
  created_at: string;
  source_conversation_id?: string | null;
}

/**
 * Write a memory item directly into public.user_memories table.
 * Automatically computes vector embedding.
 */
export async function writeMemoryStore(input: WriteMemoryInput): Promise<MemoryItem> {
  let supabase: SupabaseClient;
  let user: { id: string };

  if (input.clientOverride) {
    supabase = input.clientOverride;
    user = { id: input.ownerId || "dev-owner-id" };
  } else {
    const ctx = await getServerContext();
    supabase = ctx.supabase;
    user = ctx.user;
  }

  const targetOwnerId = input.ownerId || user.id;

  let embedding = new Array(768).fill(0);
  try {
    const res = await embedTexts([input.content]);
    if (res.embeddings && res.embeddings.length > 0) {
      embedding = res.embeddings[0];
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[MEMORY EMBED ERROR]:", err);
    }
  }

  const row = await insertUserMemory(supabase, {
    owner_id: targetOwnerId,
    type: input.type,
    content: input.content.trim(),
    importance: Math.min(10, Math.max(1, input.importance)),
    source_conversation_id: input.sourceConversationId || null,
    embedding,
  });

  return {
    id: row.id,
    ownerId: row.owner_id,
    type: row.type as MemoryType,
    content: row.content,
    embedding: row.embedding,
    importance: row.importance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceConversationId: row.source_conversation_id || undefined,
  };
}

/**
 * Retrieve memory items for an owner from public.user_memories.
 */
export async function retrieveMemoryStore(options: RetrieveMemoryOptions): Promise<MemoryItem[]> {
  const { supabase, user } = await getServerContext();
  const targetOwnerId = options.ownerId || user.id;

  const rows = await getUserMemories(supabase, targetOwnerId, {
    type: options.type,
    limit: options.limit || 10,
    minImportance: options.minImportance || 1,
  });

  return rows.map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    type: row.type as MemoryType,
    content: row.content,
    embedding: row.embedding,
    importance: row.importance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceConversationId: row.source_conversation_id || undefined,
  }));
}

/**
 * Search memory items using vector similarity via match_user_memories RPC.
 */
export async function searchMemoryStore(
  options: SearchMemoryOptions & { clientOverride?: SupabaseClient }
): Promise<MemoryItem[]> {
  let supabase: SupabaseClient;
  let user: { id: string };

  if (options.clientOverride) {
    supabase = options.clientOverride;
    user = { id: options.ownerId || "dev-owner-id" };
  } else {
    const ctx = await getServerContext();
    supabase = ctx.supabase;
    user = ctx.user;
  }

  const targetOwnerId = options.ownerId || user.id;

  let queryVector = new Array(768).fill(0);
  try {
    const res = await embedTexts([options.query]);
    if (res.embeddings && res.embeddings.length > 0) {
      queryVector = res.embeddings[0];
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[MEMORY SEARCH EMBED ERROR]:", err);
    }
  }

  const { data, error } = await supabase.rpc("match_user_memories", {
    query_embedding: queryVector,
    match_threshold: options.similarityThreshold ?? 0.0,
    match_count: options.limit ?? 5,
    filter_owner_id: targetOwnerId,
    filter_type: options.type || null,
  });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[SEARCH MEMORY RPC ERROR]:", error);
    }
    return [];
  }

  const rows = (data || []) as RpcMemoryRow[];

  return rows.map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    type: row.type,
    content: row.content,
    importance: row.importance,
    createdAt: row.created_at,
    updatedAt: row.created_at,
    sourceConversationId: row.source_conversation_id || undefined,
  }));
}

/**
 * Delete a memory item by ID from public.user_memories.
 */
export async function deleteMemoryStore(id: string, ownerId: string): Promise<boolean> {
  const { supabase, user } = await getServerContext();
  const targetOwnerId = ownerId || user.id;

  const { error } = await supabase
    .from("user_memories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", targetOwnerId);

  return !error;
}

/**
 * Update importance of a memory item in public.user_memories.
 */
export async function updateMemoryImportanceStore(
  id: string,
  importance: number,
  ownerId: string
): Promise<MemoryItem | null> {
  const { supabase, user } = await getServerContext();
  const targetOwnerId = ownerId || user.id;

  try {
    const updated = await updateUserMemory(supabase, id, targetOwnerId, {
      importance: Math.min(10, Math.max(1, importance)),
    });

    return {
      id: updated.id,
      ownerId: updated.owner_id,
      type: updated.type as MemoryType,
      content: updated.content,
      embedding: updated.embedding,
      importance: updated.importance,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      sourceConversationId: updated.source_conversation_id || undefined,
    };
  } catch {
    return null;
  }
}
