/**
 * app/(dashboard)/layout.tsx
 *
 * Dashboard layout — server-side session guard.
 *
 * Middleware is the primary protection layer.
 * This layout provides a secondary server-side check:
 * if the session is missing when the layout renders, redirect to /login.
 *
 * Architecture reference: ARCHITECTURE.md §7 Authentication Flow
 */

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: {
    template: "%s · Aura OS",
    default: "Dashboard · Aura OS",
  },
  description:
    "Aura OS — the AI-native operating system for autonomous agents, missions, and knowledge management.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Secondary guard — middleware should catch this first.
  if (!user) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
