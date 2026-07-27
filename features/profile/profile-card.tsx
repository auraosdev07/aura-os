import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ProfileCard({
  title,
  description,
  children,
  className,
}: ProfileCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
