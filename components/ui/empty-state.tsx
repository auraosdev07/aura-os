import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/10 border border-border rounded-xl">
      <p className="text-lg font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 text-center mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
