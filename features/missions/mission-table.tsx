"use client";

import type { MissionView } from "@/services/mission";
import { MissionStatusBadge } from "./mission-status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MissionTableProps {
  missions: MissionView[];
  onEdit: (mission: MissionView) => void;
  onArchive: (mission: MissionView) => void;
  onRestore: (mission: MissionView) => void;
}

export function MissionTable({ missions, onEdit, onArchive, onRestore }: MissionTableProps) {
  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/10 border border-border rounded-xl">
        <p className="text-lg font-medium text-foreground">No missions found</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Get started by creating a new mission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Mission</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Team</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {missions.map((mission) => {
                const isArchived = mission.deleted_at !== null;
                return (
                  <tr key={mission.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="font-medium text-foreground truncate" title={mission.title}>
                        <Link href={`/missions/${mission.id}`} className="hover:underline text-primary">
                          {mission.title}
                        </Link>
                      </div>
                      {mission.due_date && (
                        <div className="text-xs text-muted-foreground">
                          Due: {new Date(mission.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {mission.priority || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <MissionStatusBadge status={mission.status} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      <div>M: {mission.assignedManagers}</div>
                      <div>E: {mission.assignedEmployees}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      <div>{mission.progress}%</div>
                      <div className="flex gap-2">
                        <span>A: {mission.artifactCount}</span>
                        <span>K: {mission.knowledgeCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEdit(mission)}
                        >
                          Edit
                        </Button>
                        {isArchived ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onRestore(mission)}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => onArchive(mission)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
