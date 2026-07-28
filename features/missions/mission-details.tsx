"use client";

import { useEffect, useState } from "react";
import { getMission, type MissionView } from "@/services/mission";
import { AssignmentPanel } from "./assignment-panel";
import { MissionStatusBadge } from "./mission-status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface MissionDetailsProps {
  missionId: string;
}

export function MissionDetails({ missionId }: MissionDetailsProps) {
  const [mission, setMission] = useState<MissionView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMission(missionId);
        if (!data) {
          setError("Mission not found.");
        } else {
          setMission(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mission.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [missionId]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-10 w-48 bg-muted/20 rounded"></div>
        <div className="h-64 bg-muted/20 rounded-xl"></div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-xl text-destructive mb-4">{error || "Mission not found."}</p>
        <Link href="/missions">
          <Button variant="outline">Back to Missions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/missions" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Missions
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{mission.title}</h1>
            {mission.description && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{mission.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground">Status:</div>
            <MissionStatusBadge status={mission.status} className="text-sm px-3 py-1" />
          </div>
        </div>
      </div>

      {/* Panels Layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Assignment Panel */}
        <AssignmentPanel mission={mission} />

        {/* Future Modules Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border border-dashed bg-muted/5 p-8 text-center opacity-70">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">Attach documents and contexts to this mission.</p>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Coming Soon</div>
          </div>
          
          <div className="rounded-xl border border-border border-dashed bg-muted/5 p-8 text-center opacity-70">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Artifacts</h3>
            <p className="text-sm text-muted-foreground">Generated code, assets, and deliverables.</p>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Coming Soon</div>
          </div>
        </div>
        
        <div className="rounded-xl border border-border border-dashed bg-muted/5 p-8 text-center opacity-70">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">AI Execution Timeline</h3>
          <p className="text-sm text-muted-foreground">Watch agents execute tasks in real-time.</p>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Coming Soon</div>
        </div>
      </div>
    </div>
  );
}
