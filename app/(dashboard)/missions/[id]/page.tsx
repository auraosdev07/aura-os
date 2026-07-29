import type { Metadata } from "next";
import { MissionDetails } from "@/features/missions/mission-details";

export const metadata: Metadata = {
  title: "Mission Details | Aura OS",
  description: "Manage your mission.",
};

interface MissionPageProps {
  params: Promise<{ id: string }>;
}

export default async function MissionPage({ params }: MissionPageProps) {
  const resolvedParams = await params;
  return (
    <div className="flex-1 p-6 md:p-8">
      <MissionDetails missionId={resolvedParams.id} />
    </div>
  );
}
