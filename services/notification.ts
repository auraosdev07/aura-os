"use server";

"use server";

import { getServerContext } from "@/lib/auth/get-server-context";
import { 
  getNotifications as getNotificationsQuery,
  getNotificationById,
  type NotificationFilters,
  getRecentMissions,
  getRecentEmployees,
  getRecentKnowledge
} from "@/lib/db/queries";
import { 
  updateNotification,
  markAllNotificationsRead,
  softDeleteNotification,
  restoreNotification as restoreNotificationMutation,
  deleteNotification as hardDeleteNotification
} from "@/lib/db/mutations";
import type { NotificationRow } from "@/types/database";

export interface NotificationView {
  id: string;
  title: string;
  message: string | null;
  isRead: boolean;
  type: string;
  actor: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  actor: string;
  entityType: string | null;
  entityId: string | null;
  timestamp: string;
}

function mapNotification(row: NotificationRow): NotificationView {
  return {
    id: row.id,
    title: row.title,
    message: row.body, // Map database body -> UI message
    isRead: row.is_read,
    type: row.type,
    actor: row.actor,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at
  };
}

export async function getNotifications(filters?: NotificationFilters, limit: number = 50): Promise<NotificationView[]> {
  const { supabase, user } = await getServerContext();

  const rows = await getNotificationsQuery(supabase, user.id, filters, limit);
  return rows.map(mapNotification);
}

export async function getUnreadNotifications(limit: number = 50): Promise<NotificationView[]> {
  return getNotifications({ isRead: false }, limit);
}

export async function markAsRead(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();

  // Verify ownership
  const existing = await getNotificationById(supabase, id, user.id);
  if (!existing) throw new Error("Notification not found");

  await updateNotification(supabase, id, user.id, { is_read: true });
}

export async function markAllAsRead(): Promise<void> {
  const { supabase, user } = await getServerContext();

  await markAllNotificationsRead(supabase, user.id);
}

export async function archiveNotification(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();

  const existing = await getNotificationById(supabase, id, user.id);
  if (!existing) throw new Error("Notification not found");

  await softDeleteNotification(supabase, id, user.id);
}

export async function restoreNotification(id: string): Promise<void> {
  const { supabase, user } = await getServerContext();

  // We don't verify ownership via getNotificationById here because it filters out soft-deleted
  // A true robust implementation might do a custom query or bypass `is("deleted_at", null)`.
  // For now, we trust the ID if they have access to it or we can just try restoring it.
  await restoreNotificationMutation(supabase, id, user.id);
}

/**
 * Builds a unified timeline of recent activity across multiple entities.
 */
export async function buildActivityTimeline(limit: number = 20): Promise<TimelineItem[]> {
  const { supabase, user } = await getServerContext();

  const ownerId = user.id;

  // Fetch from multiple sources concurrently
  const [
    recentNotifications,
    recentMissions,
    recentEmployees,
    recentKnowledge
  ] = await Promise.all([
    getNotificationsQuery(supabase, ownerId, {}, limit),
    getRecentMissions(supabase, ownerId, limit),
    getRecentEmployees(supabase, ownerId, limit),
    getRecentKnowledge(supabase, ownerId, limit)
  ]);

  const timeline: TimelineItem[] = [];

  // Map notifications
  for (const notif of recentNotifications) {
    timeline.push({
      id: notif.id,
      title: notif.title,
      description: notif.body,
      type: notif.type,
      actor: notif.actor,
      entityType: notif.entity_type,
      entityId: notif.entity_id,
      timestamp: notif.created_at
    });
  }

  // Map recent missions (if they don't have a notification)
  for (const m of recentMissions) {
    timeline.push({
      id: `mission-${m.id}`,
      title: `Mission Created: ${m.title}`,
      description: `Status: ${m.status}`,
      type: "INFO",
      actor: "OWNER",
      entityType: "MISSION",
      entityId: m.id,
      timestamp: m.created_at
    });
  }

  // Map recent employees
  for (const e of recentEmployees) {
    timeline.push({
      id: `employee-${e.id}`,
      title: `Employee Onboarded: ${e.name}`,
      description: `Role: ${e.role}`,
      type: "INFO",
      actor: "OWNER",
      entityType: "EMPLOYEE",
      entityId: e.id,
      timestamp: e.created_at
    });
  }

  // Map recent knowledge
  for (const k of recentKnowledge) {
    timeline.push({
      id: `knowledge-${k.id}`,
      title: `Knowledge Entry Added: ${k.title}`,
      description: `Layer: ${k.layer}`,
      type: "INFO",
      actor: "OWNER",
      entityType: "KNOWLEDGE",
      entityId: k.id,
      timestamp: k.created_at
    });
  }

  // Sort unified timeline by timestamp descending
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Return the top `limit` items
  return timeline.slice(0, limit);
}
