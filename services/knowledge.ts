"use server";

/**
 * services/knowledge.ts
 *
 * Business logic layer for Knowledge operations.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { 
  getKnowledgeEntries, 
  getKnowledgeEntryById,
  type KnowledgeFilters
} from "@/lib/db/queries";
import {
  createKnowledgeEntry as createKnowledgeEntryMutation,
  updateKnowledgeEntry as updateKnowledgeEntryMutation,
  softDeleteKnowledgeEntry,
  restoreKnowledgeEntry as restoreKnowledgeEntryMutation,
} from "@/lib/db/mutations";
import type { KnowledgeEntryRow, KnowledgeEntryInsert, KnowledgeEntryUpdate } from "@/types/database";
import { indexKnowledge, deleteKnowledgeIndex } from "@/services/rag";



/**
 * KnowledgeView defines the UI-facing representation of a Knowledge Entry.
 * Extensible for future AI insights, relevance scores, and metadata.
 */
export interface KnowledgeView extends Omit<KnowledgeEntryRow, 'created_at' | 'updated_at' | 'deleted_at'> {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Placeholders for future dynamic properties
  relevanceScore?: number;
  aiSummary?: string;
  relatedArtifactCount: number;
}

/** Utility to map a raw DB row to the rich UI view model */
function toKnowledgeView(row: KnowledgeEntryRow): KnowledgeView {
  return {
    ...row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    relatedArtifactCount: 0, // Placeholder
  };
}

export async function getKnowledge(filters?: KnowledgeFilters): Promise<KnowledgeView[]> {
  const { supabase, user } = await getServerContext();
  
  const rows = await getKnowledgeEntries(supabase, user.id, filters);
  return rows.map(toKnowledgeView);
}

export async function getKnowledgeById(id: string): Promise<KnowledgeView | null> {
  const { supabase, user } = await getServerContext();
  
  const row = await getKnowledgeEntryById(supabase, id);
  if (!row) return null;
  
  // RLS ensures only the owner can read it, but let's be explicitly safe 
  if (row.owner_id !== user.id) return null;
  
  return toKnowledgeView(row);
}

export async function createKnowledge(
  data: Omit<KnowledgeEntryInsert, "owner_id">
): Promise<KnowledgeView> {
  const { supabase, user } = await getServerContext();
  
  // Validation based on layer
  if (data.layer === "PROJECT" && !data.mission_id) {
    throw new Error("Mission ID is required for PROJECT layer knowledge.");
  }
  if (data.layer === "EMPLOYEE" && !data.employee_id) {
    throw new Error("Employee ID is required for EMPLOYEE layer knowledge.");
  }
  
  const row = await createKnowledgeEntryMutation(supabase, {
    ...data,
    owner_id: user.id,
  });
  
  // Automatic RAG indexing (never blocks or rolls back main CRUD operation)
  try {
    await indexKnowledge(row.id);
  } catch (err) {
    console.error(`[RAG AUTO-INDEXING ERROR] Failed to index knowledge entry ${row.id}:`, err);
  }
  
  return toKnowledgeView(row);
}

export async function updateKnowledge(id: string, data: KnowledgeEntryUpdate): Promise<KnowledgeView> {
  const { supabase, user } = await getServerContext();
  
  // Validation based on layer
  if (data.layer === "PROJECT" && data.mission_id === null) {
    throw new Error("Mission ID is required for PROJECT layer knowledge.");
  }
  if (data.layer === "EMPLOYEE" && data.employee_id === null) {
    throw new Error("Employee ID is required for EMPLOYEE layer knowledge.");
  }
  
  const row = await updateKnowledgeEntryMutation(supabase, id, user.id, data);

  // Automatic RAG re-indexing
  try {
    await indexKnowledge(id);
  } catch (err) {
    console.error(`[RAG AUTO-INDEXING ERROR] Failed to re-index knowledge entry ${id}:`, err);
  }
  
  return toKnowledgeView(row);
}

export async function archiveKnowledge(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await softDeleteKnowledgeEntry(supabase, id, user.id);

  // Automatic index deletion
  try {
    await deleteKnowledgeIndex(id);
  } catch (err) {
    console.error(`[RAG AUTO-INDEXING ERROR] Failed to delete index for knowledge entry ${id}:`, err);
  }
}

export async function restoreKnowledge(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await restoreKnowledgeEntryMutation(supabase, id, user.id);

  // Automatic RAG re-indexing on restore
  try {
    await indexKnowledge(id);
  } catch (err) {
    console.error(`[RAG AUTO-INDEXING ERROR] Failed to re-index restored knowledge entry ${id}:`, err);
  }
}

/** 
 * Search is currently implemented using standard ILIKE via filters, 
 * but this service boundary allows swapping to pgvector or full text search 
 * natively in the future without changing the UI.
 */
export async function searchKnowledge(query: string, filters?: Omit<KnowledgeFilters, 'search'>): Promise<KnowledgeView[]> {
  return getKnowledge({ ...filters, search: query });
}

export async function getMissionKnowledge(missionId: string): Promise<KnowledgeView[]> {
  return getKnowledge({ layer: 'PROJECT', missionId });
}

export async function getEmployeeKnowledge(employeeId: string): Promise<KnowledgeView[]> {
  return getKnowledge({ layer: 'EMPLOYEE', employeeId });
}
