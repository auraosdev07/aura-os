import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardKpiCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

export function DashboardKpiCard({ title, value, icon, description, className }: DashboardKpiCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-6", className)}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
