"use client";

import type { NotificationView } from "@/services/notification";
import { NotificationCard } from "./notification-card";

interface NotificationTableProps {
  notifications: NotificationView[];
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
}

export function NotificationTable({ notifications, onMarkAsRead, onArchive }: NotificationTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {notifications.map((notif) => (
        <NotificationCard 
          key={notif.id} 
          notification={notif} 
          onMarkAsRead={onMarkAsRead}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
