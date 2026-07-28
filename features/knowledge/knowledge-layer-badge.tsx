import { cn } from "@/lib/utils";
import type { KnowledgeLayer } from "@/types/database";

interface KnowledgeLayerBadgeProps {
  layer: KnowledgeLayer;
  className?: string;
}

export function KnowledgeLayerBadge({ layer, className }: KnowledgeLayerBadgeProps) {
  const styles: Record<KnowledgeLayer, string> = {
    COMPANY: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    PROJECT: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    EMPLOYEE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  };

  const labels: Record<KnowledgeLayer, string> = {
    COMPANY: "Company",
    PROJECT: "Project",
    EMPLOYEE: "Employee",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[layer],
        className
      )}
    >
      {labels[layer]}
    </span>
  );
}
