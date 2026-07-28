"use client";

import { cn } from "@/lib/utils";

interface NotificationFilterProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function NotificationFilter({ currentTab, onTabChange }: NotificationFilterProps) {
  return (
    <div className="flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onTabChange("ALL")}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          currentTab === "ALL" && "bg-background text-foreground shadow"
        )}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onTabChange("UNREAD")}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          currentTab === "UNREAD" && "bg-background text-foreground shadow"
        )}
      >
        Unread
      </button>
    </div>
  );
}
