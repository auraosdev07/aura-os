import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ManagerCardProps {
  children: ReactNode;
  className?: string;
}

export function ManagerCard({ children, className }: ManagerCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}
