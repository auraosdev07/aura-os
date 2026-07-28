import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmployeeCardProps {
  children: ReactNode;
  className?: string;
}

export function EmployeeCard({ children, className }: EmployeeCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}
