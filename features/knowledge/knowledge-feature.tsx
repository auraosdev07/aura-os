"use client";

import { useState, useCallback, useEffect } from "react";
import type { KnowledgeView } from "@/services/knowledge";
import type { KnowledgeLayer, KnowledgeEntryInsert, KnowledgeEntryUpdate } from "@/types/database";
import { KnowledgeToolbar } from "./knowledge-toolbar";
import { KnowledgeTable } from "./knowledge-table";
import { KnowledgeDialog } from "./knowledge-dialog";
import { KnowledgeForm } from "./knowledge-form";
import { getKnowledge, createKnowledge, updateKnowledge, archiveKnowledge, searchKnowledge } from "@/services/knowledge";
// For mission and employee lists in the form
import { getMissions } from "@/services/mission";
import { getEmployees } from "@/services/employee";

export function KnowledgeFeature() {
  const [entries, setEntries] = useState<KnowledgeView[]>([]);
  const [missions, setMissions] = useState<{ id: string; title: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<KnowledgeLayer | "ALL">("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeView | null>(null);

  const loadKnowledge = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let data: KnowledgeView[];
      
      const filters = layerFilter !== "ALL" ? { layer: layerFilter } : undefined;

      if (searchQuery) {
        data = await searchKnowledge(searchQuery, filters);
      } else {
        data = await getKnowledge(filters);
      }
      setEntries(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge entries");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, layerFilter]);

  // We load missions and employees once for the form dropdowns
  const loadFormDependencies = useCallback(async () => {
    try {
      const [missionData, employeeData] = await Promise.all([
        getMissions(),
        getEmployees(),
      ]);
      setMissions(missionData.map(m => ({ id: m.id, title: m.title })));
      setEmployees(employeeData.map(e => ({ id: e.id, name: e.name })));
    } catch (err) {
      console.error("Failed to load dependencies for knowledge form", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKnowledge();
  }, [loadKnowledge]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFormDependencies();
  }, [loadFormDependencies]);

  const handleCreateOrUpdate = async (data: KnowledgeEntryInsert | KnowledgeEntryUpdate) => {
    if (editingEntry) {
      await updateKnowledge(editingEntry.id, data as KnowledgeEntryUpdate);
    } else {
      await createKnowledge(data as KnowledgeEntryInsert);
    }
    setIsDialogOpen(false);
    loadKnowledge();
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this knowledge entry?")) return;
    try {
      await archiveKnowledge(id);
      loadKnowledge();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Manage your organizational intelligence, project context, and employee memory.
        </p>
      </div>

      <KnowledgeToolbar
        currentLayer={layerFilter}
        onFilterLayer={setLayerFilter}
        onSearch={setSearchQuery}
        onNew={() => {
          setEditingEntry(null);
          setIsDialogOpen(true);
        }}
      />

      {error && (
        <div className="p-4 text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <KnowledgeTable
          entries={entries}
          onEdit={(entry) => {
            setEditingEntry(entry);
            setIsDialogOpen(true);
          }}
          onArchive={handleArchive}
        />
      )}

      <KnowledgeDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingEntry ? "Edit Knowledge Entry" : "New Knowledge Entry"}
      >
        <KnowledgeForm
          initialData={editingEntry}
          missions={missions}
          employees={employees}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsDialogOpen(false)}
        />
      </KnowledgeDialog>
    </div>
  );
}
