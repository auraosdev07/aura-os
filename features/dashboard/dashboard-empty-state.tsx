import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function DashboardEmptyState({ title, description, icon, className }: DashboardEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-card/50", className)}>
      {icon && <div className="h-10 w-10 text-muted-foreground mb-4 opacity-50">{icon}</div>}
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
  );
}
