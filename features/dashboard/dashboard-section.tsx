import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ title, description, children, className }: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}
