"use server";

import { getServerContext } from "@/lib/auth/get-server-context";
import {
  getManagerCount,
  getEmployeeCount,
  getMissionCount,
  getKnowledgeCount,
  getRecentMissions,
  getRecentEmployees,
  getRecentKnowledge,
  getMissionStatuses,
  getEmployeeStatuses,
  getKnowledgeLayers
} from "@/lib/db/queries";

export interface DashboardKPIs {
  totalManagers: number;
  totalEmployees: number;
  activeMissions: number;
  completedMissions: number;
  totalKnowledge: number;
}

export interface DashboardRecentActivity {
  missions: { id: string; title: string; status: string; createdAt: string }[];
  employees: { id: string; name: string; role: string; createdAt: string }[];
  knowledge: { id: string; title: string; layer: string; createdAt: string }[];
}

export interface DashboardDistributions {
  missionStatuses: Record<string, number>;
  employeeStatuses: Record<string, number>;
  knowledgeLayers: Record<string, number>;
}

import { buildActivityTimeline, getUnreadNotifications, type TimelineItem, type NotificationView } from "@/services/notification";

export interface DashboardView {
  kpis: DashboardKPIs;
  recentActivity: DashboardRecentActivity;
  distributions: DashboardDistributions;
  timeline: TimelineItem[];
  unreadNotifications: NotificationView[];
}

export async function buildDashboardView(): Promise<DashboardView> {
  const { supabase, user } = await getServerContext();
  
  const ownerId = user.id;

  // Execute all independent queries concurrently
  const [
    totalManagers,
    totalEmployees,
    activeMissions,
    completedMissions,
    totalKnowledge,
    recentMissionsRaw,
    recentEmployeesRaw,
    recentKnowledgeRaw,
    missionStatusesRaw,
    employeeStatusesRaw,
    knowledgeLayersRaw
  ] = await Promise.all([
    getManagerCount(supabase, ownerId),
    getEmployeeCount(supabase, ownerId),
    getMissionCount(supabase, ownerId, { excludeStatuses: ["COMPLETED", "CANCELLED"] }),
    getMissionCount(supabase, ownerId, { status: "COMPLETED" }),
    getKnowledgeCount(supabase, ownerId),
    getRecentMissions(supabase, ownerId, 5),
    getRecentEmployees(supabase, ownerId, 5),
    getRecentKnowledge(supabase, ownerId, 5),
    getMissionStatuses(supabase, ownerId),
    getEmployeeStatuses(supabase, ownerId),
    getKnowledgeLayers(supabase, ownerId)
  ]);

  // Aggregate distributions in memory
  const missionStatuses: Record<string, number> = {};
  for (const row of missionStatusesRaw) {
    missionStatuses[row.status] = (missionStatuses[row.status] || 0) + 1;
  }

  const employeeStatuses: Record<string, number> = {};
  for (const row of employeeStatusesRaw) {
    employeeStatuses[row.status] = (employeeStatuses[row.status] || 0) + 1;
  }

  const knowledgeLayers: Record<string, number> = {};
  for (const row of knowledgeLayersRaw) {
    knowledgeLayers[row.layer] = (knowledgeLayers[row.layer] || 0) + 1;
  }

  const timeline = await buildActivityTimeline(5);
  const unreadNotifications = await getUnreadNotifications(5);

  return {
    kpis: {
      totalManagers,
      totalEmployees,
      activeMissions,
      completedMissions,
      totalKnowledge
    },
    recentActivity: {
      missions: recentMissionsRaw.map(m => ({
        id: m.id,
        title: m.title,
        status: m.status,
        createdAt: m.created_at
      })),
      employees: recentEmployeesRaw.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role,
        createdAt: e.created_at
      })),
      knowledge: recentKnowledgeRaw.map(k => ({
        id: k.id,
        title: k.title,
        layer: k.layer,
        createdAt: k.created_at
      }))
    },
    distributions: {
      missionStatuses,
      employeeStatuses,
      knowledgeLayers
    },
    timeline,
    unreadNotifications
  };
}
