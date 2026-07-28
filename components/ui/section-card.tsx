import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className = "" }: SectionCardProps) {
  return (
    <div className={`p-6 bg-card border border-border rounded-xl shadow-sm ${className}`}>
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title && <h3 className="text-lg font-medium text-foreground">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
