"use client";

import type { TimelineItem as TimelineItemType } from "@/services/notification";
import { ActivityItem } from "./activity-item";

interface ActivityTimelineProps {
  items: TimelineItemType[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center p-8 text-sm text-muted-foreground border rounded-lg border-dashed">
        No recent activity found.
      </div>
    );
  }

  return (
    <div className="ml-4">
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </div>
  );
}
