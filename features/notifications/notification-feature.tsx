"use client";

import { useState } from "react";
import type { NotificationView, TimelineItem } from "@/services/notification";
import { NotificationToolbar } from "./notification-toolbar";
import { NotificationFilter } from "./notification-filter";
import { NotificationTable } from "./notification-table";
import { NotificationEmptyState } from "./notification-empty-state";
import { ActivityTimeline } from "./activity-timeline";
import { markAsRead, markAllAsRead, archiveNotification } from "@/services/notification";
import { useRouter } from "next/navigation";

interface NotificationFeatureProps {
  initialNotifications: NotificationView[];
  initialTimeline: TimelineItem[];
}

export function NotificationFeature({ initialNotifications, initialTimeline }: NotificationFeatureProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL");

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  let filtered = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.message && n.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filter === "UNREAD") {
    filtered = filtered.filter(n => !n.isRead);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Notifications Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <NotificationFilter currentTab={filter} onTabChange={setFilter} />
          <NotificationToolbar onSearch={setSearchQuery} onMarkAllAsRead={handleMarkAllAsRead} />
        </div>

        {filtered.length === 0 ? (
          <NotificationEmptyState 
            title="All caught up" 
            description={filter === "UNREAD" ? "You have no unread notifications right now." : "No notifications available."}
          />
        ) : (
          <NotificationTable 
            notifications={filtered} 
            onMarkAsRead={handleMarkAsRead}
            onArchive={handleArchive}
          />
        )}
      </div>

      {/* Timeline Column */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold tracking-tight border-b pb-2">Activity Timeline</h3>
        <ActivityTimeline items={initialTimeline} />
      </div>
    </div>
  );
}
