import { cn } from "@/lib/utils";
import type { MissionStatus } from "@/types/database";

interface MissionStatusBadgeProps {
  status: MissionStatus;
  className?: string;
}

export function MissionStatusBadge({ status, className }: MissionStatusBadgeProps) {
  const colors: Record<MissionStatus, string> = {
    IDEA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    PLANNING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    APPROVAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    EXECUTION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    REVIEW: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
