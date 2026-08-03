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
  KnowledgeChunkRow,
  UserMemoryRow,
  ConversationRow,
  ConversationMessageRow,
  ConversationSummaryRow,
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
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// employees
// ---------------------------------------------------------------------------

export interface EmployeeFilters {
  search?: string;
  department?: string;
  managerId?: string;
  status?: string;
  archived?: boolean;
  limit?: number;
  offset?: number;
}

/** Fetch all active employees for an owner. */
export async function getEmployees(
  client: SupabaseClient,
  ownerId: string,
  filters?: EmployeeFilters,
): Promise<EmployeeRow[]> {
  let query = client
    .from("employees")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters?.department) {
    query = query.eq("department", filters.department);
  }
  if (filters?.managerId) {
    query = query.eq("manager_id", filters.managerId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    const limit = filters.limit;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch all archived employees for an owner. */
export async function getArchivedEmployees(
  client: SupabaseClient,
  ownerId: string,
  filters?: EmployeeFilters,
): Promise<EmployeeRow[]> {
  let query = client
    .from("employees")
    .select("*")
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters?.department) {
    query = query.eq("department", filters.department);
  }
  if (filters?.managerId) {
    query = query.eq("manager_id", filters.managerId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    const limit = filters.limit;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
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

export interface MissionFilters {
  status?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/** Fetch all active missions for an owner with optional filters. */
export async function getMissions(
  client: SupabaseClient,
  ownerId: string,
  filters?: MissionFilters,
): Promise<MissionRow[]> {
  let query = client
    .from("missions")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters?.limit) {
    const limit = filters.limit;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch all archived missions for an owner. */
export async function getArchivedMissions(
  client: SupabaseClient,
  ownerId: string,
  filters?: MissionFilters,
): Promise<MissionRow[]> {
  let query = client
    .from("missions")
    .select("*")
    .eq("owner_id", ownerId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters?.limit) {
    const limit = filters.limit;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
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

/** Fetch all assignments for a list of missions. */
export async function getMissionAssignmentsByMissionIds(
  client: SupabaseClient,
  missionIds: string[],
): Promise<MissionAssignmentRow[]> {
  if (missionIds.length === 0) return [];
  const { data, error } = await client
    .from("mission_assignments")
    .select("*")
    .in("mission_id", missionIds);
  if (error) throw error;
  return data ?? [];
}

/** Fetch all assignments for a specific manager. */
export async function getMissionAssignmentsByManager(
  client: SupabaseClient,
  managerId: string,
): Promise<MissionAssignmentRow[]> {
  const { data, error } = await client
    .from("mission_assignments")
    .select("*")
    .eq("manager_id", managerId);
  if (error) throw error;
  return data ?? [];
}

/** Fetch all assignments for a specific employee. */
export async function getMissionAssignmentsByEmployee(
  client: SupabaseClient,
  employeeId: string,
): Promise<MissionAssignmentRow[]> {
  const { data, error } = await client
    .from("mission_assignments")
    .select("*")
    .eq("employee_id", employeeId);
  if (error) throw error;
  return data ?? [];
}

/** Fetch all assignments for a list of employees. */
export async function getMissionAssignmentsByEmployeeIds(
  client: SupabaseClient,
  employeeIds: string[],
): Promise<MissionAssignmentRow[]> {
  if (employeeIds.length === 0) return [];
  const { data, error } = await client
    .from("mission_assignments")
    .select("*")
    .in("employee_id", employeeIds);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// knowledge_entries
// ---------------------------------------------------------------------------

export interface KnowledgeFilters {
  layer?: KnowledgeLayer;
  missionId?: string;
  employeeId?: string;
  search?: string;
}

/** Fetch all active knowledge entries for an owner. */
export async function getKnowledgeEntries(
  client: SupabaseClient,
  ownerId: string,
  filters?: KnowledgeFilters
): Promise<KnowledgeEntryRow[]> {
  let query = client
    .from("knowledge_entries")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.layer) {
    query = query.eq("layer", filters.layer);
  }
  if (filters?.missionId) {
    query = query.eq("mission_id", filters.missionId);
  }
  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch a specific knowledge entry by ID. */
export async function getKnowledgeEntryById(
  client: SupabaseClient,
  id: string,
): Promise<KnowledgeEntryRow | null> {
  const { data, error } = await client
    .from("knowledge_entries")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
  return data;
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

/** Fetch indexed knowledge chunks for a knowledge entry. */
export async function getKnowledgeChunksByKnowledgeId(
  client: SupabaseClient,
  knowledgeId: string,
): Promise<KnowledgeChunkRow[]> {
  const { data, error } = await client
    .from("knowledge_chunks")
    .select("*")
    .eq("knowledge_id", knowledgeId)
    .order("chunk_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Fetch indexed knowledge chunks for an artifact. */
export async function getKnowledgeChunksByArtifactId(
  client: SupabaseClient,
  artifactId: string,
): Promise<KnowledgeChunkRow[]> {
  const { data, error } = await client
    .from("knowledge_chunks")
    .select("*")
    .eq("artifact_id", artifactId)
    .order("chunk_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// artifacts
// ---------------------------------------------------------------------------

export interface ArtifactFilters {
  missionId?: string;
  employeeId?: string;
  knowledgeId?: string;
  search?: string;
}

export interface ArtifactRowWithRelations extends ArtifactRow {
  mission?: { title: string } | null;
  employee?: { name: string } | null;
  knowledge?: { title: string } | null;
}

export async function getArtifacts(
  client: SupabaseClient,
  ownerId: string,
  filters?: ArtifactFilters
): Promise<ArtifactRowWithRelations[]> {
  let query = client
    .from("artifacts")
    .select("*, mission:missions(title), employee:employees(name), knowledge:knowledge_entries(title)")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.missionId) {
    query = query.eq("mission_id", filters.missionId);
  }
  if (filters?.employeeId) {
    query = query.eq("employeeId", filters.employeeId);
  }
  if (filters?.knowledgeId) {
    query = query.eq("knowledge_id", filters.knowledgeId);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getArtifactById(
  client: SupabaseClient,
  id: string,
  ownerId: string
): Promise<ArtifactRowWithRelations | null> {
  const { data, error } = await client
    .from("artifacts")
    .select("*, mission:missions(title), employee:employees(name), knowledge:knowledge_entries(title)")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data;
}

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
// dashboard (optimized fetches)
// ---------------------------------------------------------------------------


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCount(client: SupabaseClient, table: string, ownerId: string, queryBuilder?: (q: any) => any): Promise<number> {
  let query = client.from(table).select("*", { count: "exact", head: true }).eq("owner_id", ownerId).is("deleted_at", null);
  if (queryBuilder) query = queryBuilder(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getManagerCount(client: SupabaseClient, ownerId: string): Promise<number> {
  return getCount(client, "managers", ownerId);
}

export async function getEmployeeCount(client: SupabaseClient, ownerId: string): Promise<number> {
  const { count, error } = await client
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function getMissionCount(
  client: SupabaseClient, 
  ownerId: string, 
  options?: { excludeStatuses?: string[], status?: string }
): Promise<number> {
  return getCount(client, "missions", ownerId, (q) => {
    let query = q;
    if (options?.excludeStatuses) {
      query = query.not("status", "in", `(${options.excludeStatuses.join(',')})`);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }
    return query;
  });
}

export async function getKnowledgeCount(client: SupabaseClient, ownerId: string): Promise<number> {
  return getCount(client, "knowledge_entries", ownerId);
}


async function getRecent<T>(client: SupabaseClient, table: string, selectFields: string, ownerId: string, limit: number): Promise<T[]> {
  const { data, error } = await client.from(table).select(selectFields).eq("owner_id", ownerId).is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data as T[];
}

export async function getRecentMissions(client: SupabaseClient, ownerId: string, limit: number = 5): Promise<{ id: string; title: string; status: string; created_at: string }[]> {
  return getRecent(client, "missions", "id, title, status, created_at", ownerId, limit);
}

export async function getRecentEmployees(client: SupabaseClient, ownerId: string, limit: number = 5): Promise<{ id: string; name: string; role: string; created_at: string }[]> {
  return getRecent(client, "employees", "id, name, role, created_at", ownerId, limit);
}

export async function getRecentKnowledge(client: SupabaseClient, ownerId: string, limit: number = 5): Promise<{ id: string; title: string; layer: string; created_at: string }[]> {
  return getRecent(client, "knowledge_entries", "id, title, layer, created_at", ownerId, limit);
}

export async function getMissionStatuses(client: SupabaseClient, ownerId: string): Promise<{ status: string }[]> {
  const { data, error } = await client
    .from("missions")
    .select("status")
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) throw error;
  return data ?? [];
}

export async function getEmployeeStatuses(client: SupabaseClient, ownerId: string): Promise<{ status: string }[]> {
  const { data, error } = await client
    .from("employees")
    .select("status")
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) throw error;
  return data ?? [];
}

export async function getKnowledgeLayers(client: SupabaseClient, ownerId: string): Promise<{ layer: string }[]> {
  const { data, error } = await client
    .from("knowledge_entries")
    .select("layer")
    .eq("owner_id", ownerId)
    .is("deleted_at", null);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------

export interface NotificationFilters {
  isRead?: boolean;
  type?: string;
  entityType?: string;
  entityId?: string;
}

export async function getNotifications(
  client: SupabaseClient,
  ownerId: string,
  filters?: NotificationFilters,
  limit: number = 50
): Promise<NotificationRow[]> {
  let query = client
    .from("notifications")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.isRead !== undefined) {
    query = query.eq("is_read", filters.isRead);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getNotificationById(
  client: SupabaseClient,
  id: string,
  ownerId: string
): Promise<NotificationRow | null> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Persistent Memory & Conversation System Queries
// ---------------------------------------------------------------------------

export interface UserMemoryQueryOptions {
  type?: string;
  limit?: number;
  minImportance?: number;
}

/** Fetch user memories for an owner with optional filters. */
export async function getUserMemories(
  client: SupabaseClient,
  ownerId: string,
  options?: UserMemoryQueryOptions
): Promise<UserMemoryRow[]> {
  let query = client
    .from("user_memories")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.type) {
    query = query.eq("type", options.type);
  }
  if (options?.minImportance) {
    query = query.gte("importance", options.minImportance);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single conversation thread by ID. */
export async function getConversation(
  client: SupabaseClient,
  conversationId: string,
  ownerId: string
): Promise<ConversationRow | null> {
  const { data, error } = await client
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/** Fetch all messages in a conversation in chronological order. */
export async function getConversationMessages(
  client: SupabaseClient,
  conversationId: string
): Promise<ConversationMessageRow[]> {
  const { data, error } = await client
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch the latest conversation summary for a conversation. */
export async function getConversationSummary(
  client: SupabaseClient,
  conversationId: string
): Promise<ConversationSummaryRow | null> {
  const { data, error } = await client
    .from("conversation_summaries")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Product Management CMS Queries
// ---------------------------------------------------------------------------

export interface ProductFilters {
  status?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/** Fetch all active categories for an owner. */
export async function getCategories(
  client: SupabaseClient,
  ownerId: string
): Promise<import("@/types/database").CategoryRow[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch all active collections for an owner. */
export async function getCollections(
  client: SupabaseClient,
  ownerId: string
): Promise<import("@/types/database").CollectionRow[]> {
  const { data, error } = await client
    .from("collections")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch products for an owner with optional filters. */
export async function getProducts(
  client: SupabaseClient,
  ownerId: string,
  filters?: ProductFilters
): Promise<import("@/types/database").ProductRow[]> {
  let query = client
    .from("products")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch a single product by ID with full details. */
export async function getProductById(
  client: SupabaseClient,
  productId: string,
  ownerId: string
): Promise<import("@/types/database").ProductRow | null> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/** Fetch normalized product images sorted by position. */
export async function getProductImages(
  client: SupabaseClient,
  productId: string
): Promise<import("@/types/database").ProductImageRow[]> {
  const { data, error } = await client
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch normalized variant options for a product. */
export async function getVariantOptions(
  client: SupabaseClient,
  productId: string
): Promise<import("@/types/database").VariantOptionRow[]> {
  const { data, error } = await client
    .from("variant_options")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch normalized product variants for a product. */
export async function getProductVariants(
  client: SupabaseClient,
  productId: string
): Promise<import("@/types/database").ProductVariantRow[]> {
  const { data, error } = await client
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetch inventory logs for a product. */
export async function getInventoryLogs(
  client: SupabaseClient,
  productId: string
): Promise<import("@/types/database").InventoryLogRow[]> {
  const { data, error } = await client
    .from("inventory_logs")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Fetch URL redirects for an owner. */
export async function getUrlRedirects(
  client: SupabaseClient,
  ownerId: string
): Promise<import("@/types/database").UrlRedirectRow[]> {
  const { data, error } = await client
    .from("url_redirects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

