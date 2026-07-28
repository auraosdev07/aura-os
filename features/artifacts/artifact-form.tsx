"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface ArtifactFormData {
  file: File;
  name: string;
  mission_id: string | null;
  employee_id: string | null;
  knowledge_id: string | null;
}

interface ArtifactFormProps {
  initialData?: Partial<ArtifactFormData>;
  onSubmit: (data: ArtifactFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ArtifactForm({ initialData, onSubmit, onCancel, isSubmitting }: ArtifactFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(initialData?.name || "");
  const [missionId, setMissionId] = useState(initialData?.mission_id || "");
  const [employeeId, setEmployeeId] = useState(initialData?.employee_id || "");
  const [knowledgeId, setKnowledgeId] = useState(initialData?.knowledge_id || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      await onSubmit({
        file,
        name: name || file.name,
        mission_id: missionId || null,
        employee_id: employeeId || null,
        knowledge_id: knowledgeId || null
      });
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "An error occurred during upload.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor="file-upload">
          File Selection <span className="text-destructive">*</span>
        </label>
        <input
          id="file-upload"
          type="file"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) {
              setFile(selected);
              if (!name) setName(selected.name);
            }
          }}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor="name">
          Display Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="e.g. Q3 Financial Report.pdf"
          disabled={isSubmitting}
        />
        <p className="text-[0.8rem] text-muted-foreground">
          Defaults to the original filename if left blank.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor="missionId">
          Link to Mission (ID)
        </label>
        <input
          id="missionId"
          value={missionId}
          onChange={(e) => setMissionId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Mission UUID (optional)"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor="employeeId">
          Link to Employee (ID)
        </label>
        <input
          id="employeeId"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Employee UUID (optional)"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor="knowledgeId">
          Link to Knowledge Entry (ID)
        </label>
        <input
          id="knowledgeId"
          value={knowledgeId}
          onChange={(e) => setKnowledgeId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Knowledge UUID (optional)"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !file}>
          {isSubmitting ? "Uploading..." : "Upload Artifact"}
        </Button>
      </div>
    </form>
  );
}
