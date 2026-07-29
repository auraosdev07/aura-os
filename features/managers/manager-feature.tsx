"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { getManagers, createManager, updateManager, archiveManager, restoreManager } from "@/services/manager";
import type { ManagerTableRow } from "./manager-table";
import { ManagerTable } from "./manager-table";
import { ManagerDialog } from "./manager-dialog";
import { ManagerForm, type ManagerFormData } from "./manager-form";
import { Button } from "@/components/ui/button";

export function ManagerFeature() {
  const router = useRouter();
  const [managers, setManagers] = useState<ManagerTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerTableRow | null>(null);

  useEffect(() => {
    loadManagers();
  }, []);

  async function loadManagers() {
    setIsLoading(true);
    try {
      const data = await getManagers();
      setManagers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load managers.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(data: ManagerFormData) {
    const newManager = await createManager(data);
    setManagers(prev => [newManager, ...prev]);
    setIsCreateOpen(false);
    router.refresh();
  }

  async function handleEdit(data: ManagerFormData) {
    if (!editingManager) return;
    const updated = await updateManager(editingManager.id, data);
    setManagers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingManager(null);
    router.refresh();
  }

  async function handleArchive(manager: ManagerTableRow) {
    // Optimistic update could go here, but let's do real update for simplicity/safety
    try {
      await archiveManager(manager.id);
      await loadManagers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive manager.");
    }
    router.refresh();
  }

  async function handleRestore(manager: ManagerTableRow) {
    try {
      await restoreManager(manager.id);
      await loadManagers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore manager.");
    }
    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-lg" />
        <div className="h-64 bg-muted/20 animate-pulse rounded-xl border border-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Managers</h2>
        <Button onClick={() => setIsCreateOpen(true)}>+ Add Manager</Button>
      </div>

      <ManagerTable 
        managers={managers} 
        onEdit={setEditingManager}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />

      <ManagerDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Add New Manager"
      >
        <ManagerForm 
          onSubmit={handleCreate} 
          onCancel={() => setIsCreateOpen(false)} 
        />
      </ManagerDialog>

      <ManagerDialog 
        isOpen={!!editingManager} 
        onClose={() => setEditingManager(null)}
        title="Edit Manager"
      >
        <ManagerForm 
          initialData={editingManager}
          onSubmit={handleEdit} 
          onCancel={() => setEditingManager(null)} 
        />
      </ManagerDialog>
    </div>
  );
}
