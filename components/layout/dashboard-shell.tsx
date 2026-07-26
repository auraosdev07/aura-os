"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ActivityPanel } from "@/components/activity/activity-panel";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
   Dashboard Shell
   Manages sidebar collapse / mobile state and wires all layout
   regions together. Business logic stays in child pages.
────────────────────────────────────────────────────────────── */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const openMobile      = useCallback(() => setMobileOpen(true), []);
  const closeMobile     = useCallback(() => setMobileOpen(false), []);

  const sidebarWidth = collapsed ? 68 : 280;

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* ── Left Sidebar ── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      {/* ── Main column (offset by sidebar on desktop) ── */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0",
          "transition-all duration-300 ease-in-out",
          "lg:ml-[var(--sidebar-offset)]",
        )}
        style={
          { "--sidebar-offset": `${sidebarWidth}px` } as React.CSSProperties
        }
      >
        {/* ── Sticky Topbar ── */}
        <Topbar onMenuClick={openMobile} />

        {/* ── Content row: main area + activity panel ── */}
        <div className="flex flex-1 min-h-0">
          {/* Primary scrollable content */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 md:px-6 md:py-8"
          >
            {children}
          </main>

          {/* Right activity panel — reserved slot, empty until wired up */}
          <aside
            aria-label="Activity panel"
            className="hidden 2xl:flex w-[0px] shrink-0 flex-col border-l border-border/60 bg-card/30 transition-all duration-300"
          >
            <ActivityPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
