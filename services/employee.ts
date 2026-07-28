"use server";

/**
 * services/employee.ts
 *
 * Business logic layer for Employee operations.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { 
  getEmployees as getEmployeesQuery, 
  getArchivedEmployees as getArchivedEmployeesQuery,
  getEmployeeById,
  getManagers, // to resolve manager names
  getMissionAssignmentsByEmployeeIds,
  getMissionAssignmentsByEmployee,
  type EmployeeFilters 
} from "@/lib/db/queries";
import {
  createEmployee as createEmployeeMutation,
  updateEmployee as updateEmployeeMutation,
  softDeleteEmployee,
  restoreEmployee as restoreEmployeeMutation,
} from "@/lib/db/mutations";
import type { EmployeeRow, EmployeeInsert, EmployeeUpdate, MissionAssignmentRow } from "@/types/database";

export type { EmployeeFilters };

/**
 * EmployeeView defines the UI-facing representation of an Employee.
 */
export interface EmployeeView extends Omit<EmployeeRow, 'created_at' | 'updated_at' | 'deleted_at'> {
  createdAt: string;
  managerName: string | null;
  activeMissionCount: number;
  artifactCount: number;
  knowledgeCount: number;
  deleted_at: string | null;
}

/** Utility to map a raw DB row to the rich UI view model */
function toEmployeeView(
  row: EmployeeRow, 
  managerMap: Map<string, string>,
  assignments: MissionAssignmentRow[]
): EmployeeView {
  const activeMissions = assignments.filter(a => a.employee_id === row.id).length;
  
  return {
    ...row,
    createdAt: row.created_at,
    managerName: row.manager_id ? (managerMap.get(row.manager_id) || "Unknown Manager") : null,
    activeMissionCount: activeMissions,
    artifactCount: 0,
    knowledgeCount: 0,
  };
}

/**
 * Helper to build the manager map for the authenticated owner.
 */
async function buildManagerMap(ownerId: string): Promise<Map<string, string>> {
  const { supabase } = await getServerContext();
  const managers = await getManagers(supabase, ownerId);
  return new Map(managers.map(m => [m.id, m.name]));
}

export async function getEmployees(filters?: EmployeeFilters): Promise<EmployeeView[]> {
  const { supabase, user } = await getServerContext();
  
  const [rows, managerMap] = await Promise.all([
    getEmployeesQuery(supabase, user.id, filters),
    buildManagerMap(user.id),
  ]);
  
  if (rows.length === 0) return [];
  const assignments = await getMissionAssignmentsByEmployeeIds(supabase, rows.map(r => r.id));
  
  return rows.map(r => toEmployeeView(r, managerMap, assignments));
}

export async function getArchivedEmployees(filters?: EmployeeFilters): Promise<EmployeeView[]> {
  const { supabase, user } = await getServerContext();
  
  const [rows, managerMap] = await Promise.all([
    getArchivedEmployeesQuery(supabase, user.id, filters),
    buildManagerMap(user.id),
  ]);
  
  if (rows.length === 0) return [];
  const assignments = await getMissionAssignmentsByEmployeeIds(supabase, rows.map(r => r.id));
  
  return rows.map(r => toEmployeeView(r, managerMap, assignments));
}

export async function getEmployee(id: string): Promise<EmployeeView | null> {
  const { supabase, user } = await getServerContext();
  
  
  const [row, managerMap, assignments] = await Promise.all([
    getEmployeeById(supabase, id),
    buildManagerMap(user.id),
    getMissionAssignmentsByEmployee(supabase, id),
  ]);
  
  if (!row) return null;
  return toEmployeeView(row, managerMap, assignments);
}

export async function createEmployee(
  data: Omit<EmployeeInsert, "owner_id">
): Promise<EmployeeView> {
  const { supabase, user } = await getServerContext();
  
  const row = await createEmployeeMutation(supabase, {
    ...data,
    owner_id: user.id,
  });
  
  const managerMap = await buildManagerMap(user.id);
  return toEmployeeView(row, managerMap, []);
}

export async function updateEmployee(id: string, data: EmployeeUpdate): Promise<EmployeeView> {
  const { supabase, user } = await getServerContext();
  
  const row = await updateEmployeeMutation(supabase, id, user.id, data);
  const [managerMap, assignments] = await Promise.all([
    buildManagerMap(user.id),
    getMissionAssignmentsByEmployee(supabase, id),
  ]);
  return toEmployeeView(row, managerMap, assignments);
}

export async function archiveEmployee(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await softDeleteEmployee(supabase, id, user.id);
}

export async function restoreEmployee(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await restoreEmployeeMutation(supabase, id, user.id);
}
