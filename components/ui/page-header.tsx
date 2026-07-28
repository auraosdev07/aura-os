import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function PageHeader({ title, description, actionLabel, onAction, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </div>
  );
}
