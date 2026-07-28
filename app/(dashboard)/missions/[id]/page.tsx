import type { Metadata } from "next";
import { MissionDetails } from "@/features/missions/mission-details";

export const metadata: Metadata = {
  title: "Mission Details | Aura OS",
  description: "Manage your mission.",
};

interface MissionPageProps {
  params: { id: string };
}

export default function MissionPage({ params }: MissionPageProps) {
  return (
    <div className="flex-1 p-6 md:p-8">
      <MissionDetails missionId={params.id} />
    </div>
  );
}
