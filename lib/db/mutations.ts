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
