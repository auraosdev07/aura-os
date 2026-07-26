import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: {
    template: "%s · Aura OS",
    default: "Dashboard · Aura OS",
  },
  description:
    "Aura OS — the AI-native operating system for autonomous agents, missions, and knowledge management.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
