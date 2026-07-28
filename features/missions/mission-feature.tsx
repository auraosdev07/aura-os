"use client";

import { useState, useEffect } from "react";
import { getMissions, getArchivedMissions, createMission, updateMission, archiveMission, restoreMission, type MissionView, type MissionFilters } from "@/services/mission";
import { MissionTable } from "./mission-table";
import { MissionDialog } from "./mission-dialog";
import { MissionForm, type MissionFormData } from "./mission-form";
import { MissionToolbar } from "./mission-toolbar";
import { Button } from "@/components/ui/button";

export function MissionFeature() {
  const [missions, setMissions] = useState<MissionView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [viewArchived, setViewArchived] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<MissionView | null>(null);

  useEffect(() => {
    // Simple debounce for search
    const timer = setTimeout(() => {
      loadMissions();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, viewArchived]);

  async function loadMissions() {
    setIsLoading(true);
    setError(null);
    try {
      const filters: MissionFilters = {
        search: search.trim() || undefined,
        // limit: 50, // Pagination ready
        // offset: 0,
      };

      if (viewArchived) {
        setMissions(await getArchivedMissions(filters));
      } else {
        setMissions(await getMissions(filters));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load missions.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(data: MissionFormData) {
    await createMission({ ...data, assigned_to: null });
    await loadMissions();
    setIsCreateOpen(false);
  }

  async function handleEdit(data: MissionFormData) {
    if (!editingMission) return;
    await updateMission(editingMission.id, data);
    await loadMissions();
    setEditingMission(null);
  }

  async function handleArchive(mission: MissionView) {
    try {
      await archiveMission(mission.id);
      await loadMissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive mission.");
    }
  }

  async function handleRestore(mission: MissionView) {
    try {
      await restoreMission(mission.id);
      await loadMissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore mission.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <MissionToolbar 
          search={search}
          onSearchChange={setSearch}
          onCreateClick={() => setIsCreateOpen(true)}
        />
        
        <div className="flex items-center gap-2">
          <Button 
            variant={viewArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setViewArchived(true)}
          >
            Archived
          </Button>
          <Button 
            variant={!viewArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setViewArchived(false)}
          >
            Active
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-64 bg-muted/20 animate-pulse rounded-xl border border-border" />
        </div>
      ) : (
        <MissionTable 
          missions={missions} 
          onEdit={setEditingMission}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      )}

      <MissionDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Create Mission"
      >
        <MissionForm 
          onSubmit={handleCreate} 
          onCancel={() => setIsCreateOpen(false)} 
        />
      </MissionDialog>

      <MissionDialog 
        isOpen={!!editingMission} 
        onClose={() => setEditingMission(null)}
        title="Edit Mission"
      >
        <MissionForm 
          initialData={editingMission}
          onSubmit={handleEdit} 
          onCancel={() => setEditingMission(null)} 
        />
      </MissionDialog>
    </div>
  );
}
