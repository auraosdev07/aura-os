"use client";

import { useState } from "react";
import type { KnowledgeLayer, KnowledgeEntryInsert, KnowledgeEntryUpdate } from "@/types/database";
import type { KnowledgeView } from "@/services/knowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MissionBasic {
  id: string;
  title: string;
}

interface EmployeeBasic {
  id: string;
  name: string;
}

interface KnowledgeFormProps {
  initialData?: KnowledgeView | null;
  missions: MissionBasic[];
  employees: EmployeeBasic[];
  onSubmit: (data: KnowledgeEntryInsert | KnowledgeEntryUpdate) => Promise<void>;
  onCancel: () => void;
}

export function KnowledgeForm({
  initialData,
  missions,
  employees,
  onSubmit,
  onCancel,
}: KnowledgeFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [layer, setLayer] = useState<KnowledgeLayer>(initialData?.layer || "COMPANY");
  const [missionId, setMissionId] = useState(initialData?.mission_id || "");
  const [employeeId, setEmployeeId] = useState(initialData?.employee_id || "");
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    
    if (!trimmedContent) {
      setError("Content is required.");
      return;
    }

    if (layer === "PROJECT" && !missionId) {
      setError("Please select a mission for the PROJECT layer.");
      return;
    }

    if (layer === "EMPLOYEE" && !employeeId) {
      setError("Please select an employee for the EMPLOYEE layer.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        content: trimmedContent,
        layer,
        mission_id: layer === "PROJECT" ? missionId : null,
        employee_id: layer === "EMPLOYEE" ? employeeId : null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false); // only reset on error so dialog can close cleanly on success
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium leading-none">Title</label>
          <Input
            id="title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Knowledge Title"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="layer" className="text-sm font-medium leading-none">Knowledge Layer</label>
          <select
            id="layer"
            value={layer}
            onChange={(e) => setLayer(e.target.value as KnowledgeLayer)}
            disabled={isSubmitting || !!initialData} // Usually you don't change layer after creation
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="COMPANY">Company</option>
            <option value="PROJECT">Project</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>

        {layer === "PROJECT" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label htmlFor="missionId" className="text-sm font-medium leading-none">Associated Mission</label>
            <select
              id="missionId"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a mission</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        )}

        {layer === "EMPLOYEE" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label htmlFor="employeeId" className="text-sm font-medium leading-none">Associated Employee</label>
            <select
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select an employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium leading-none">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Write your knowledge entry here..."
            className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Entry"}
        </Button>
      </div>
    </form>
  );
}
