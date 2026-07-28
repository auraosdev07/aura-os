import type { Metadata } from "next";
import { MissionFeature } from "@/features/missions/mission-feature";

export const metadata: Metadata = {
  title: "Missions | Aura OS",
  description: "Manage your core work units and AI execution.",
};

export default function MissionsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Missions</h2>
      </div>
      <div className="w-full">
        <MissionFeature />
      </div>
    </div>
  );
}
