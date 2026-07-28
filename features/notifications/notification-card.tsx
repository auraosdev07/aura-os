"use client";

import type { NotificationView } from "@/services/notification";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  notification: NotificationView;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
}

export function NotificationCard({ notification, onMarkAsRead, onArchive }: NotificationCardProps) {
  return (
    <div className={cn("transition-colors rounded-xl border bg-card text-card-foreground shadow", !notification.isRead && "bg-muted/50 border-primary/20")}>
      <div className="p-4 flex gap-4">
        <div className="shrink-0 mt-1">
          <Bell className={cn("h-5 w-5", !notification.isRead ? "text-primary" : "text-muted-foreground")} />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <h4 className={cn("font-medium text-sm truncate", !notification.isRead && "text-primary")}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Intl.DateTimeFormat("en-US", { 
                month: "short", 
                day: "numeric", 
                hour: "numeric", 
                minute: "2-digit" 
              }).format(new Date(notification.createdAt))}
            </span>
          </div>
          
          {notification.message && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {!notification.isRead && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs" 
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={() => onArchive(notification.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
