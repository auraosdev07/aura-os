import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ArtifactEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ArtifactEmptyState({ title, description, icon, action, className }: ArtifactEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-card/50", className)}>
      {icon && <div className="h-12 w-12 text-muted-foreground mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
