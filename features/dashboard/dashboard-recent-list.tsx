import Link from "next/link";
import { DashboardEmptyState } from "./dashboard-empty-state";

export interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
}

interface DashboardRecentListProps {
  items: RecentItem[];
  emptyTitle: string;
  emptyDescription: string;
}

export function DashboardRecentList({ items, emptyTitle, emptyDescription }: DashboardRecentListProps) {
  if (items.length === 0) {
    return <DashboardEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Link 
          key={item.id} 
          href={item.href}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-2"
        >
          <div className="flex flex-col">
            <span className="font-medium text-sm">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(item.createdAt))}
          </span>
        </Link>
      ))}
    </div>
  );
}
