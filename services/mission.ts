"use server";

/**
 * services/mission.ts
 *
 * Mission service — business logic layer for Mission operations.
 *
 * All database access goes through lib/db/queries.ts and lib/db/mutations.ts.
 * Components call these service functions; they never import from lib/db directly.
 *
 * Architecture reference: ARCHITECTURE.md §8 Data Flow, PRD §10 FR-07–FR-16
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import {
  getMissions as getMissionsQuery,
  getArchivedMissions as getArchivedMissionsQuery,
  getMissionById,
  getMissionAssignments,
  type MissionFilters
} from "@/lib/db/queries";
import {
  createMission as createMissionMutation,
  updateMission as updateMissionMutation,
  softDeleteMission,
  restoreMission as restoreMissionMutation,
  createMissionAssignment,
  deleteMissionAssignment,
} from "@/lib/db/mutations";
import type { MissionRow, MissionInsert, MissionUpdate, MissionAssignmentRow, ManagerRow, EmployeeRow } from "@/types/database";

export interface MissionAssignmentView extends MissionAssignmentRow {
  manager?: ManagerRow;
  employee?: EmployeeRow;
}

export interface MissionView extends MissionRow {
  assignments: MissionAssignmentView[];
  assignedManagers: number;
  assignedEmployees: number;
  progress: number;
  artifactCount: number;
  knowledgeCount: number;
}



export async function getMissions(filters?: MissionFilters): Promise<MissionView[]> {
  const { supabase, user } = await getServerContext();
  
  const rows = await getMissionsQuery(supabase, user.id, filters);
  if (rows.length === 0) return [];
  
  const assignments = await Promise.all(rows.map(m => getMissionAssignments(supabase, m.id)));
  return rows.map((r, i) => ({ 
    ...r, 
    assignments: assignments[i],
    assignedManagers: assignments[i].filter(a => a.target_type === 'MANAGER').length,
    assignedEmployees: assignments[i].filter(a => a.target_type === 'EMPLOYEE').length,
    progress: 0,
    artifactCount: 0,
    knowledgeCount: 0
  }));
}

export async function getArchivedMissions(filters?: MissionFilters): Promise<MissionView[]> {
  const { supabase, user } = await getServerContext();
  
  const rows = await getArchivedMissionsQuery(supabase, user.id, filters);
  if (rows.length === 0) return [];
  
  const assignments = await Promise.all(rows.map(m => getMissionAssignments(supabase, m.id)));
  return rows.map((r, i) => ({ 
    ...r, 
    assignments: assignments[i],
    assignedManagers: assignments[i].filter(a => a.target_type === 'MANAGER').length,
    assignedEmployees: assignments[i].filter(a => a.target_type === 'EMPLOYEE').length,
    progress: 0,
    artifactCount: 0,
    knowledgeCount: 0
  }));
}

export async function getMission(id: string): Promise<MissionView | null> {
  const { supabase } = await getServerContext();
  
  const row = await getMissionById(supabase, id);
  if (!row) return null;
  const assignments = await getMissionAssignments(supabase, id);
  return { 
    ...row, 
    assignments,
    assignedManagers: assignments.filter(a => a.target_type === 'MANAGER').length,
    assignedEmployees: assignments.filter(a => a.target_type === 'EMPLOYEE').length,
    progress: 0,
    artifactCount: 0,
    knowledgeCount: 0
  };
}

export async function createMission(
  data: Omit<MissionInsert, "owner_id" | "created_by">
): Promise<MissionView> {
  const { supabase, user } = await getServerContext();
  
  const row = await createMissionMutation(supabase, {
    ...data,
    owner_id: user.id,
    created_by: user.id,
  });
  return { 
    ...row, 
    assignments: [],
    assignedManagers: 0,
    assignedEmployees: 0,
    progress: 0,
    artifactCount: 0,
    knowledgeCount: 0
  };
}

export async function updateMission(id: string, data: MissionUpdate): Promise<MissionView> {
  const { supabase, user } = await getServerContext();
  
  const row = await updateMissionMutation(supabase, id, user.id, data);
  const assignments = await getMissionAssignments(supabase, id);
  return { 
    ...row, 
    assignments,
    assignedManagers: assignments.filter(a => a.target_type === 'MANAGER').length,
    assignedEmployees: assignments.filter(a => a.target_type === 'EMPLOYEE').length,
    progress: 0,
    artifactCount: 0,
    knowledgeCount: 0
  };
}

export async function archiveMission(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await softDeleteMission(supabase, id, user.id);
}

export async function restoreMission(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();
  
  await restoreMissionMutation(supabase, id, user.id);
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export async function getMissionAssignmentsList(missionId: string): Promise<MissionAssignmentRow[]> {
  const { supabase } = await getServerContext();
  
  return await getMissionAssignments(supabase, missionId);
}

export type AssignmentResult = { success: boolean; error?: string };

export async function assignManager(missionId: string, managerId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();

  const mission = await getMissionById(supabase, missionId);
  if (!mission || mission.owner_id !== user.id) {
    throw new Error("Unauthorized");
  }

  
  // Idempotency check
  const existing = await getMissionAssignments(supabase, missionId);
  if (existing.some(a => a.target_type === 'MANAGER' && a.manager_id === managerId)) {
    return { success: true };
  }
  
  await createMissionAssignment(supabase, {
    mission_id: missionId,
    target_type: 'MANAGER',
    manager_id: managerId,
    employee_id: null,
    assigned_by_owner: true,
  });
  return { success: true };
}

export async function assignEmployee(missionId: string, employeeId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();

  const mission = await getMissionById(supabase, missionId);
  if (!mission || mission.owner_id !== user.id) {
    throw new Error("Unauthorized");
  }

  
  // Idempotency check
  const existing = await getMissionAssignments(supabase, missionId);
  if (existing.some(a => a.target_type === 'EMPLOYEE' && a.employee_id === employeeId)) {
    return { success: true };
  }
  
  await createMissionAssignment(supabase, {
    mission_id: missionId,
    target_type: 'EMPLOYEE',
    employee_id: employeeId,
    manager_id: null,
    assigned_by_owner: true,
  });
  return { success: true };
}

export async function removeManager(missionId: string, managerId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();

  const mission = await getMissionById(supabase, missionId);
  if (!mission || mission.owner_id !== user.id) {
    throw new Error("Unauthorized");
  }

  
  const existing = await getMissionAssignments(supabase, missionId);
  const assignment = existing.find(a => a.target_type === 'MANAGER' && a.manager_id === managerId);
  if (!assignment) return { success: true };
  
  await deleteMissionAssignment(supabase, assignment.id);
  return { success: true };
}

export async function removeEmployee(missionId: string, employeeId: string): Promise<AssignmentResult> {
  const { supabase, user } = await getServerContext();

  const mission = await getMissionById(supabase, missionId);
  if (!mission || mission.owner_id !== user.id) {
    throw new Error("Unauthorized");
  }

  
  const existing = await getMissionAssignments(supabase, missionId);
  const assignment = existing.find(a => a.target_type === 'EMPLOYEE' && a.employee_id === employeeId);
  if (!assignment) return { success: true };
  
  await deleteMissionAssignment(supabase, assignment.id);
  return { success: true };
}
