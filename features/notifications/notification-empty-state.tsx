"use client";

import { Bell } from "lucide-react";

interface NotificationEmptyStateProps {
  title: string;
  description: string;
}

export function NotificationEmptyState({ title, description }: NotificationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-muted/20">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        <Bell className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
