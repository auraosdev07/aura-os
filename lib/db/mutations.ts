/**
 * lib/db/mutations.ts
 *
 * Write and soft-delete mutation wrappers.
 *
 * Rules:
 * - No business logic here. Only data writes.
 * - Hard deletes are forbidden on soft-deleted tables — use softDelete*()
 *   functions which set deleted_at = now().
 * - All mutations require an authenticated Supabase client.
 * - Service functions (services/) call these helpers; components do not.
 * - updated_at is managed by the set_updated_at() database trigger.
 *
 * Architecture reference: ARCHITECTURE.md §8 Data Flow, DATABASE.md §9
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProfileRow,
  ProfileInsert,
  ProfileUpdate,
  ManagerRow,
  ManagerInsert,
  ManagerUpdate,
  EmployeeRow,
  EmployeeInsert,
  EmployeeUpdate,
  MissionRow,
  MissionInsert,
  MissionUpdate,
  MissionAssignmentRow,
  MissionAssignmentInsert,
  KnowledgeEntryRow,
  KnowledgeEntryInsert,
  KnowledgeEntryUpdate,
  ArtifactRow,
  ArtifactInsert,
  ArtifactUpdate,
  NotificationRow,
  NotificationInsert,
  NotificationUpdate,
  KnowledgeChunkRow,
  KnowledgeChunkInsert,
  KnowledgeChunkUpdate,
  UserMemoryRow,
  UserMemoryInsert,
  UserMemoryUpdate,
  ConversationRow,
  ConversationInsert,
  ConversationMessageRow,
  ConversationMessageInsert,
  ConversationSummaryRow,
  ConversationSummaryInsert,
} from "@/types/database";

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------

/** Upsert the Owner's profile (called after sign-up). */
export async function upsertProfile(
  client: SupabaseClient,
  data: ProfileRow,
): Promise<ProfileRow> {
  const { data: row, error } = await client
    .from("profiles")
    .upsert(data, { onConflict: "id" })
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** 
 * Idempotently insert a profile. 
 * If a profile with the same ID already exists, this does nothing and avoids overwriting fields.
 */
export async function insertProfileIgnoreConflicts(
  client: SupabaseClient,
  data: ProfileInsert,
): Promise<void> {
  const { error } = await client
    .from("profiles")
    .upsert(data, { onConflict: "id", ignoreDuplicates: true });
  
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Update the Owner's profile fields. */
export async function updateProfile(
  client: SupabaseClient,
  ownerId: string,
  data: ProfileUpdate,
): Promise<ProfileRow> {
  const { data: row, error } = await client
    .from("profiles")
    .update(data)
    .eq("id", ownerId)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

// ---------------------------------------------------------------------------
// managers
// ---------------------------------------------------------------------------

/** Insert a new Manager. */
export async function createManager(
  client: SupabaseClient,
  data: ManagerInsert,
): Promise<ManagerRow> {
  const { data: row, error } = await client
    .from("managers")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Update an existing Manager. */
export async function updateManager(
  client: SupabaseClient,
  managerId: string,
  ownerId: string,
  data: ManagerUpdate,
): Promise<ManagerRow> {
  const { data: row, error } = await client
    .from("managers")
    .update(data)
    .eq("id", managerId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Soft-delete a Manager (sets deleted_at = now()). Hard delete is forbidden. */
export async function softDeleteManager(
  client: SupabaseClient,
  managerId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("managers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", managerId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Restore a soft-deleted Manager (sets deleted_at = null). */
export async function restoreManager(
  client: SupabaseClient,
  managerId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("managers")
    .update({ deleted_at: null })
    .eq("id", managerId)
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// employees
// ---------------------------------------------------------------------------

/** Insert a new Employee. */
export async function createEmployee(
  client: SupabaseClient,
  data: EmployeeInsert,
): Promise<EmployeeRow> {
  const { data: row, error } = await client
    .from("employees")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Update an existing Employee. */
export async function updateEmployee(
  client: SupabaseClient,
  employeeId: string,
  ownerId: string,
  data: EmployeeUpdate,
): Promise<EmployeeRow> {
  const { data: row, error } = await client
    .from("employees")
    .update(data)
    .eq("id", employeeId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Soft-delete an Employee (sets deleted_at = now()). Hard delete is forbidden. */
export async function softDeleteEmployee(
  client: SupabaseClient,
  employeeId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("employees")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("owner_id", ownerId)
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Restore a soft-deleted Employee (sets deleted_at = null). */
export async function restoreEmployee(
  client: SupabaseClient,
  employeeId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("employees")
    .update({ deleted_at: null })
    .eq("id", employeeId)
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// missions
// ---------------------------------------------------------------------------

/** Insert a new Mission. */
export async function createMission(
  client: SupabaseClient,
  data: MissionInsert,
): Promise<MissionRow> {
  const { data: row, error } = await client
    .from("missions")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Update an existing Mission (e.g. status transition). */
export async function updateMission(
  client: SupabaseClient,
  missionId: string,
  ownerId: string,
  data: MissionUpdate,
): Promise<MissionRow> {
  const { data: row, error } = await client
    .from("missions")
    .update(data)
    .eq("id", missionId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Soft-delete a Mission (sets deleted_at = now()). Hard delete is forbidden. */
export async function softDeleteMission(
  client: SupabaseClient,
  missionId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("missions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", missionId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Restore a soft-deleted Mission (sets deleted_at = null). */
export async function restoreMission(
  client: SupabaseClient,
  missionId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("missions")
    .update({ deleted_at: null })
    .eq("id", missionId)
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// mission_assignments
// ---------------------------------------------------------------------------

/** Insert a new Mission Assignment record. */
export async function createMissionAssignment(
  client: SupabaseClient,
  data: MissionAssignmentInsert,
): Promise<MissionAssignmentRow> {
  const { data: row, error } = await client
    .from("mission_assignments")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Hard-delete a Mission Assignment (permitted — no soft delete on this table). */
export async function deleteMissionAssignment(
  client: SupabaseClient,
  assignmentId: string,
): Promise<void> {
  const { error } = await client
    .from("mission_assignments")
    .delete()
    .eq("id", assignmentId);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// knowledge_entries
// ---------------------------------------------------------------------------

/** Insert a new Knowledge Entry. */
export async function createKnowledgeEntry(
  client: SupabaseClient,
  data: KnowledgeEntryInsert,
): Promise<KnowledgeEntryRow> {
  const { data: row, error } = await client
    .from("knowledge_entries")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Update an existing Knowledge Entry. */
export async function updateKnowledgeEntry(
  client: SupabaseClient,
  entryId: string,
  ownerId: string,
  data: KnowledgeEntryUpdate,
): Promise<KnowledgeEntryRow> {
  const { data: row, error } = await client
    .from("knowledge_entries")
    .update(data)
    .eq("id", entryId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Soft-delete a Knowledge Entry. Hard delete is forbidden. */
export async function softDeleteKnowledgeEntry(
  client: SupabaseClient,
  entryId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("knowledge_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Restore a soft-deleted knowledge entry. */
export async function restoreKnowledgeEntry(
  client: SupabaseClient,
  entryId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("knowledge_entries")
    .update({ deleted_at: null })
    .eq("id", entryId)
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// artifacts
// ---------------------------------------------------------------------------

/** Insert a new Artifact record (after file is uploaded to Storage). */
export async function createArtifact(
  client: SupabaseClient,
  data: ArtifactInsert,
): Promise<ArtifactRow> {
  const { data: row, error } = await client
    .from("artifacts")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Update an existing Artifact record. */
export async function updateArtifact(
  client: SupabaseClient,
  artifactId: string,
  ownerId: string,
  data: ArtifactUpdate,
): Promise<ArtifactRow> {
  const { data: row, error } = await client
    .from("artifacts")
    .update(data)
    .eq("id", artifactId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Soft-delete an Artifact record. Hard delete is forbidden. */
export async function softDeleteArtifact(
  client: SupabaseClient,
  artifactId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("artifacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", artifactId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------

/** Insert a new Notification (called by system/service role, not user). */
export async function createNotification(
  client: SupabaseClient,
  data: NotificationInsert,
): Promise<NotificationRow> {
  const { data: row, error } = await client
    .from("notifications")
    .insert(data)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Update a Notification (e.g. mark as read). */
export async function updateNotification(
  client: SupabaseClient,
  notificationId: string,
  ownerId: string,
  data: NotificationUpdate,
): Promise<NotificationRow> {
  const { data: row, error } = await client
    .from("notifications")
    .update(data)
    .eq("id", notificationId)
    .eq("owner_id", ownerId)
    .select()
    .single();
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
  return row;
}

/** Mark all notifications as read for an owner. */
export async function markAllNotificationsRead(
  client: SupabaseClient,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("owner_id", ownerId)
    .eq("is_read", false);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Hard-delete a Notification (permitted). */
export async function deleteNotification(
  client: SupabaseClient,
  notificationId: string,
): Promise<void> {
  const { error } = await client
    .from("notifications")
    .delete()
    .eq("id", notificationId);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Soft-delete a Notification. */
export async function softDeleteNotification(
  client: SupabaseClient,
  notificationId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

/** Restore a soft-deleted Notification. */
export async function restoreNotification(
  client: SupabaseClient,
  notificationId: string,
  ownerId: string,
): Promise<void> {
  const { error } = await client
    .from("notifications")
    .update({ deleted_at: null })
    .eq("id", notificationId)
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}


export async function restoreArtifact(
  client: SupabaseClient,
  artifactId: string,
  ownerId: string
): Promise<void> {
  const { error } = await client
    .from("artifacts")
    .update({ deleted_at: null })
    .eq("id", artifactId)
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

export async function hardDeleteArtifact(
  client: SupabaseClient,
  artifactId: string,
  ownerId: string
): Promise<void> {
  const { error } = await client
    .from("artifacts")
    .delete()
    .eq("id", artifactId)
    .eq("owner_id", ownerId);
  if (error) { console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2)); throw error; }
}

// ---------------------------------------------------------------------------
// knowledge_chunks
// ---------------------------------------------------------------------------

/** Insert multiple knowledge chunks in a single bulk operation. */
export async function insertKnowledgeChunks(
  client: SupabaseClient,
  chunks: KnowledgeChunkInsert[]
): Promise<KnowledgeChunkRow[]> {
  if (chunks.length === 0) return [];
  const { data, error } = await client
    .from("knowledge_chunks")
    .insert(chunks)
    .select("*");
  if (error) {
    console.error("SUPABASE ERROR (insertKnowledgeChunks):", JSON.stringify(error, null, 2));
    throw error;
  }
  return data ?? [];
}

/** Delete all indexed chunks for a knowledge entry. */
export async function deleteKnowledgeChunksByKnowledgeId(
  client: SupabaseClient,
  knowledgeId: string,
  ownerId: string
): Promise<void> {
  const { error } = await client
    .from("knowledge_chunks")
    .delete()
    .eq("knowledge_id", knowledgeId)
    .eq("owner_id", ownerId);
  if (error) {
    console.error("SUPABASE ERROR (deleteKnowledgeChunksByKnowledgeId):", JSON.stringify(error, null, 2));
    throw error;
  }
}

/** Delete all indexed chunks for an artifact. */
export async function deleteKnowledgeChunksByArtifactId(
  client: SupabaseClient,
  artifactId: string,
  ownerId: string
): Promise<void> {
  const { error } = await client
    .from("knowledge_chunks")
    .delete()
    .eq("artifact_id", artifactId)
    .eq("owner_id", ownerId);
  if (error) {
    console.error("SUPABASE ERROR (deleteKnowledgeChunksByArtifactId):", JSON.stringify(error, null, 2));
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Persistent Memory & Conversation System Mutations
// ---------------------------------------------------------------------------

/** Create a new conversation thread. */
export async function createConversation(
  client: SupabaseClient,
  data: ConversationInsert
): Promise<ConversationRow> {
  const { data: row, error } = await client
    .from("conversations")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Append a message to a conversation thread. */
export async function appendConversationMessage(
  client: SupabaseClient,
  data: ConversationMessageInsert
): Promise<ConversationMessageRow> {
  const { data: row, error } = await client
    .from("conversation_messages")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Store a thread summary rollup. */
export async function storeConversationSummary(
  client: SupabaseClient,
  data: ConversationSummaryInsert
): Promise<ConversationSummaryRow> {
  const { data: row, error } = await client
    .from("conversation_summaries")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Insert an atomic long-term user memory. */
export async function insertUserMemory(
  client: SupabaseClient,
  data: UserMemoryInsert
): Promise<UserMemoryRow> {
  const { data: row, error } = await client
    .from("user_memories")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Update an existing user memory. */
export async function updateUserMemory(
  client: SupabaseClient,
  memoryId: string,
  ownerId: string,
  data: UserMemoryUpdate
): Promise<UserMemoryRow> {
  const { data: row, error } = await client
    .from("user_memories")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", memoryId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Increment memory access count and refresh last_accessed_at. */
export async function incrementMemoryAccessCount(
  client: SupabaseClient,
  memoryId: string,
  ownerId: string
): Promise<UserMemoryRow> {
  // 1. Read current access count
  const { data: current, error: readErr } = await client
    .from("user_memories")
    .select("access_count")
    .eq("id", memoryId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .single();

  if (readErr) throw readErr;

  const newCount = (current?.access_count ?? 0) + 1;

  // 2. Update count and last_accessed_at
  const { data: updated, error: updateErr } = await client
    .from("user_memories")
    .update({
      access_count: newCount,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId)
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (updateErr) throw updateErr;
  return updated;
}

// ---------------------------------------------------------------------------
// Product Management CMS Mutations
// ---------------------------------------------------------------------------

/** Create a new category. */
export async function createCategory(
  client: SupabaseClient,
  data: import("@/types/database").CategoryInsert
): Promise<import("@/types/database").CategoryRow> {
  const { data: row, error } = await client
    .from("categories")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Create a new collection. */
export async function createCollection(
  client: SupabaseClient,
  data: import("@/types/database").CollectionInsert
): Promise<import("@/types/database").CollectionRow> {
  const { data: row, error } = await client
    .from("collections")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

/** Create a new product. */
export async function createProduct(
  client: SupabaseClient,
  data: import("@/types/database").ProductInsert
): Promise<import("@/types/database").ProductRow> {
  const { data: row, error } = await client
    .from("products")
    .insert(data)
    .select()
    .single();
  if (error) throw error;

  // Log initial stock inventory entry
  if (row.stock_quantity > 0) {
    await client.from("inventory_logs").insert({
      product_id: row.id,
      before_quantity: 0,
      after_quantity: row.stock_quantity,
      change_quantity: row.stock_quantity,
      reason: "INITIAL_STOCK",
      created_by: row.owner_id,
    });
  }

  return row;
}

/** Update an existing product and automatically create a 301 URL redirect if slug changes. */
export async function updateProduct(
  client: SupabaseClient,
  productId: string,
  ownerId: string,
  data: import("@/types/database").ProductUpdate
): Promise<import("@/types/database").ProductRow> {
  // Fetch existing product to track slug changes and inventory changes
  const { data: existing, error: fetchErr } = await client
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchErr) throw fetchErr;

  const updatedData = { ...data, updated_at: new Date().toISOString() };

  const { data: row, error } = await client
    .from("products")
    .update(updatedData)
    .eq("id", productId)
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (error) throw error;

  // 1. Slug change redirect preservation
  if (existing.slug && data.slug && existing.slug !== data.slug) {
    await client.from("url_redirects").upsert(
      {
        owner_id: ownerId,
        source_path: `/products/${existing.slug}`,
        target_path: `/products/${data.slug}`,
        status_code: 301,
      },
      { onConflict: "source_path" }
    );
  }

  // 2. Inventory change audit logging
  if (typeof data.stock_quantity === "number" && data.stock_quantity !== existing.stock_quantity) {
    await client.from("inventory_logs").insert({
      product_id: productId,
      before_quantity: existing.stock_quantity,
      after_quantity: data.stock_quantity,
      change_quantity: data.stock_quantity - existing.stock_quantity,
      reason: "MANUAL_ADJUSTMENT",
      created_by: ownerId,
    });
  }

  return row;
}

/** Soft delete a product. */
export async function softDeleteProduct(
  client: SupabaseClient,
  productId: string,
  ownerId: string
): Promise<void> {
  const { error } = await client
    .from("products")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("owner_id", ownerId);

  if (error) throw error;
}

/** Save/Replace normalized product images. */
export async function upsertProductImages(
  client: SupabaseClient,
  productId: string,
  images: Array<{
    storage_path: string;
    public_url: string;
    alt_text?: string | null;
    caption?: string | null;
    position: number;
    is_primary: boolean;
    width?: number | null;
    height?: number | null;
  }>
): Promise<import("@/types/database").ProductImageRow[]> {
  // Delete existing images and re-insert normalized list
  await client.from("product_images").delete().eq("product_id", productId);

  if (images.length === 0) return [];

  const rows = images.map((img) => ({
    product_id: productId,
    storage_path: img.storage_path,
    public_url: img.public_url,
    alt_text: img.alt_text || null,
    caption: img.caption || null,
    position: img.position,
    is_primary: img.is_primary,
    width: img.width || null,
    height: img.height || null,
  }));

  const { data, error } = await client.from("product_images").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

/** Save/Replace normalized variant options. */
export async function upsertVariantOptions(
  client: SupabaseClient,
  productId: string,
  options: Array<{ name: string; values: string[]; position: number }>
): Promise<import("@/types/database").VariantOptionRow[]> {
  await client.from("variant_options").delete().eq("product_id", productId);

  if (options.length === 0) return [];

  const rows = options.map((opt) => ({
    product_id: productId,
    name: opt.name,
    values: opt.values,
    position: opt.position,
  }));

  const { data, error } = await client.from("variant_options").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

/** Save/Replace normalized product variants. */
export async function upsertProductVariants(
  client: SupabaseClient,
  productId: string,
  variants: Array<{
    title: string;
    options: Record<string, string>;
    price: number;
    compare_at_price?: number | null;
    cost_per_item?: number | null;
    sku?: string | null;
    barcode?: string | null;
    stock_quantity: number;
    image_id?: string | null;
  }>
): Promise<import("@/types/database").ProductVariantRow[]> {
  await client.from("product_variants").delete().eq("product_id", productId);

  if (variants.length === 0) return [];

  const rows = variants.map((v) => ({
    product_id: productId,
    title: v.title,
    options: v.options,
    price: v.price,
    compare_at_price: v.compare_at_price || null,
    cost_per_item: v.cost_per_item || null,
    sku: v.sku || null,
    barcode: v.barcode || null,
    stock_quantity: v.stock_quantity,
    image_id: v.image_id || null,
  }));

  const { data, error } = await client.from("product_variants").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

