import type { Metadata } from "next";
import {
  Bot,
  Crosshair,
  CheckSquare,
  BookOpen,
  FolderOpen,
  Zap,
} from "lucide-react";

import {
  StatCard,
  PlaceholderCard,
  SectionHeader,
  ListPlaceholder,
} from "@/components/ui/dashboard-cards";

export const metadata: Metadata = {
  title: "Dashboard · Aura OS",
};

/* ──────────────────────────────────────────────────────────────
   Stat definitions — structural placeholders, no live data
────────────────────────────────────────────────────────────── */
const STATS = [
  {
    label: "Active Agents",
    value: "—",
    sub: "No data connected",
    icon: <Bot className="h-4 w-4" />,
    accent: "blue" as const,
  },
  {
    label: "Running Missions",
    value: "—",
    sub: "No data connected",
    icon: <Crosshair className="h-4 w-4" />,
    accent: "violet" as const,
  },
  {
    label: "Open Tasks",
    value: "—",
    sub: "No data connected",
    icon: <CheckSquare className="h-4 w-4" />,
    accent: "emerald" as const,
  },
  {
    label: "Knowledge Items",
    value: "—",
    sub: "No data connected",
    icon: <BookOpen className="h-4 w-4" />,
    accent: "amber" as const,
  },
  {
    label: "Artifacts",
    value: "—",
    sub: "No data connected",
    icon: <FolderOpen className="h-4 w-4" />,
    accent: "rose" as const,
  },
  {
    label: "Events Today",
    value: "—",
    sub: "No data connected",
    icon: <Zap className="h-4 w-4" />,
    accent: "blue" as const,
  },
] satisfies React.ComponentProps<typeof StatCard>[];

/* ──────────────────────────────────────────────────────────────
   Dashboard Page
────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to Aura OS. Your AI workspace at a glance.
        </p>
      </div>

      {/* ── Stats grid ── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Key metrics
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ── Main 2-col grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <section aria-labelledby="activity-heading" className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Recent Activity"
            description="Latest events across agents and missions"
          />
          <PlaceholderCard className="p-4">
            <ListPlaceholder rows={6} />
          </PlaceholderCard>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <section aria-labelledby="quick-actions-heading" className="space-y-4">
            <SectionHeader title="Quick Actions" />
            <PlaceholderCard className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {["New Mission", "Add Agent", "Create Task", "Upload File"].map(
                  (action) => (
                    <button
                      key={action}
                      disabled
                      aria-label={`${action} (coming soon)`}
                      className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors cursor-not-allowed"
                    >
                      <span className="text-muted-foreground/50 text-lg">+</span>
                      {action}
                    </button>
                  ),
                )}
              </div>
            </PlaceholderCard>
          </section>

          {/* System status */}
          <section aria-labelledby="status-heading" className="space-y-4">
            <SectionHeader title="System Status" />
            <PlaceholderCard className="p-4">
              <div className="space-y-3">
                {["Agent Runtime", "Knowledge Engine", "Task Scheduler"].map(
                  (service) => (
                    <div key={service} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                      <span className="flex-1 text-xs text-muted-foreground">
                        {service}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted rounded px-1.5 py-0.5">
                        Offline
                      </span>
                    </div>
                  ),
                )}
              </div>
            </PlaceholderCard>
          </section>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="agents-placeholder-heading" className="space-y-4">
          <SectionHeader
            title="Top Agents"
            description="Your most active autonomous agents"
          />
          <PlaceholderCard className="p-4">
            <ListPlaceholder rows={4} />
          </PlaceholderCard>
        </section>

        <section aria-labelledby="missions-placeholder-heading" className="space-y-4">
          <SectionHeader
            title="Active Missions"
            description="Missions currently in progress"
          />
          <PlaceholderCard className="p-4">
            <ListPlaceholder rows={4} />
          </PlaceholderCard>
        </section>
      </div>
    </div>
  );
}
