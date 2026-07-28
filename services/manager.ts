"use server";

/**
 * services/manager.ts
 *
 * Business logic layer for Manager operations.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { getManagers as getManagersQuery, getManagerById } from "@/lib/db/queries";
import {
  createManager as createManagerMutation,
  updateManager as updateManagerMutation,
  softDeleteManager,
  restoreManager as restoreManagerMutation,
} from "@/lib/db/mutations";
import type { ManagerRow, ManagerInsert, ManagerUpdate } from "@/types/database";
import { getMissionAssignmentsByManager } from "@/lib/db/queries";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ManagerView extends ManagerRow {
  activeMissionCount: number;
}

async function toManagerView(supabase: SupabaseClient, row: ManagerRow): Promise<ManagerView> {
  const assignments = await getMissionAssignmentsByManager(supabase, row.id);
  return {
    ...row,
    activeMissionCount: assignments.length,
  };
}

export async function getManagers(): Promise<ManagerView[]> {
  const { supabase, user } = await getServerContext();
  
  const rows = await getManagersQuery(supabase, user.id);
  return Promise.all(rows.map(r => toManagerView(supabase, r)));
}

export async function getManager(id: string): Promise<ManagerView | null> {
  const { supabase } = await getServerContext();
  
  const row = await getManagerById(supabase, id);
  if (!row) return null;
  return toManagerView(supabase, row);
}

export async function createManager(data: Omit<ManagerInsert, "owner_id">): Promise<ManagerView> {
  const { supabase, user } = await getServerContext();
  
  const row = await createManagerMutation(supabase, {
    ...data,
    owner_id: user.id,
  });
  return toManagerView(supabase, row);
}

export async function updateManager(id: string, data: ManagerUpdate): Promise<ManagerView> {
  const { supabase, user } = await getServerContext();
  
  const row = await updateManagerMutation(supabase, id, user.id, data);
  return toManagerView(supabase, row);
}

export async function archiveManager(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await softDeleteManager(supabase, id, user.id);
}

export async function restoreManager(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await restoreManagerMutation(supabase, id, user.id);
}
