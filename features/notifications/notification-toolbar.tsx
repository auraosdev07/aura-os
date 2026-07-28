"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2 } from "lucide-react";

interface NotificationToolbarProps {
  onSearch: (q: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationToolbar({ onSearch, onMarkAllAsRead }: NotificationToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search notifications..."
          className="pl-9"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Button variant="secondary" onClick={onMarkAllAsRead}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Mark all as read
      </Button>
    </div>
  );
}
