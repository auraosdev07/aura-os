/**
 * lib/db/queries.ts
 *
 * Read-only database query wrappers.
 *
 * Rules:
 * - No business logic here. Only data retrieval.
 * - All queries filter soft-deleted rows (where deleted_at is null).
 * - All queries require an authenticated Supabase client — callers must
 *   provide one from lib/supabase/server.ts or lib/supabase/client.ts.
 * - Service functions (services/) call these helpers; components do not.
 *
 * Architecture reference: ARCHITECTURE.md §8 Data Flow, DATABASE.md §2
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProfileRow,
  ManagerRow,
  EmployeeRow,
  MissionRow,
  MissionAssignmentRow,
  KnowledgeEntryRow,
  ArtifactRow,
  NotificationRow,
  MissionStatus,
  EmployeeStatus,
  KnowledgeLayer,
} from "@/types/database";

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------

/** Fetch the Owner's profile by their auth UID. */
export async function getProfile(
  client: SupabaseClient,
  ownerId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// managers
// ---------------------------------------------------------------------------

/** Fetch all active managers for an owner. */
export async function getManagers(
  client: SupabaseClient,
  ownerId: string,
): Promise<ManagerRow[]> {
  const { data, error } = await client
    .from("managers")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single manager by ID. */
export async function getManagerById(
  client: SupabaseClient,
  managerId: string,
): Promise<ManagerRow | null> {
  const { data, error } = await client
    .from("managers")
    .select("*")
    .eq("id", managerId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// employees
// ---------------------------------------------------------------------------

/** Fetch all active employees for an owner. */
export async function getEmployees(
  client: SupabaseClient,
  ownerId: string,
): Promise<EmployeeRow[]> {
  const { data, error } = await client
    .from("employees")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single employee by ID. */
export async function getEmployeeById(
  client: SupabaseClient,
  employeeId: string,
): Promise<EmployeeRow | null> {
  const { data, error } = await client
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Fetch all active employees belonging to a specific manager. */
export async function getEmployeesByManager(
  client: SupabaseClient,
  managerId: string,
): Promise<EmployeeRow[]> {
  const { data, error } = await client
    .from("employees")
    .select("*")
    .eq("manager_id", managerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch all active employees with a specific status. */
export async function getEmployeesByStatus(
  client: SupabaseClient,
  ownerId: string,
  status: EmployeeStatus,
): Promise<EmployeeRow[]> {
  const { data, error } = await client
    .from("employees")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", status)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// missions
// ---------------------------------------------------------------------------

/** Fetch all active missions for an owner. */
export async function getMissions(
  client: SupabaseClient,
  ownerId: string,
): Promise<MissionRow[]> {
  const { data, error } = await client
    .from("missions")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single mission by ID. */
export async function getMissionById(
  client: SupabaseClient,
  missionId: string,
): Promise<MissionRow | null> {
  const { data, error } = await client
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Fetch all active missions filtered by lifecycle status. */
export async function getMissionsByStatus(
  client: SupabaseClient,
  ownerId: string,
  status: MissionStatus,
): Promise<MissionRow[]> {
  const { data, error } = await client
    .from("missions")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", status)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// mission_assignments
// ---------------------------------------------------------------------------

/** Fetch all assignments for a mission. */
export async function getMissionAssignments(
  client: SupabaseClient,
  missionId: string,
): Promise<MissionAssignmentRow[]> {
  const { data, error } = await client
    .from("mission_assignments")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// knowledge_entries
// ---------------------------------------------------------------------------

/** Fetch all active knowledge entries for an owner. */
export async function getKnowledgeEntries(
  client: SupabaseClient,
  ownerId: string,
): Promise<KnowledgeEntryRow[]> {
  const { data, error } = await client
    .from("knowledge_entries")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch knowledge entries filtered by layer. */
export async function getKnowledgeEntriesByLayer(
  client: SupabaseClient,
  ownerId: string,
  layer: KnowledgeLayer,
): Promise<KnowledgeEntryRow[]> {
  const { data, error } = await client
    .from("knowledge_entries")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("layer", layer)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch knowledge entries for a specific mission (PROJECT layer). */
export async function getKnowledgeEntriesByMission(
  client: SupabaseClient,
  missionId: string,
): Promise<KnowledgeEntryRow[]> {
  const { data, error } = await client
    .from("knowledge_entries")
    .select("*")
    .eq("mission_id", missionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch knowledge entries for a specific employee (EMPLOYEE layer). */
export async function getKnowledgeEntriesByEmployee(
  client: SupabaseClient,
  employeeId: string,
): Promise<KnowledgeEntryRow[]> {
  const { data, error } = await client
    .from("knowledge_entries")
    .select("*")
    .eq("employee_id", employeeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// artifacts
// ---------------------------------------------------------------------------

/** Fetch all active artifacts for an owner. */
export async function getArtifacts(
  client: SupabaseClient,
  ownerId: string,
): Promise<ArtifactRow[]> {
  const { data, error } = await client
    .from("artifacts")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch artifacts for a specific mission. */
export async function getArtifactsByMission(
  client: SupabaseClient,
  missionId: string,
): Promise<ArtifactRow[]> {
  const { data, error } = await client
    .from("artifacts")
    .select("*")
    .eq("mission_id", missionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------

/** Fetch all notifications for an owner, newest first. */
export async function getNotifications(
  client: SupabaseClient,
  ownerId: string,
): Promise<NotificationRow[]> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch only unread notifications for an owner. */
export async function getUnreadNotifications(
  client: SupabaseClient,
  ownerId: string,
): Promise<NotificationRow[]> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
