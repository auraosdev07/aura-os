import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types/database";

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
  className?: string;
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  const colors: Record<EmployeeStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    IDLE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    ON_MISSION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    INACTIVE: "bg-muted text-muted-foreground",
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
