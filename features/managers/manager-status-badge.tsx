import { cn } from "@/lib/utils";

interface ManagerStatusBadgeProps {
  deletedAt: string | null;
  className?: string;
}

export function ManagerStatusBadge({ deletedAt, className }: ManagerStatusBadgeProps) {
  const isArchived = deletedAt !== null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isArchived
          ? "bg-muted text-muted-foreground"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        className
      )}
    >
      {isArchived ? "Archived" : "Active"}
    </span>
  );
}
