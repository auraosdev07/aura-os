"use client";

import { useState, type FormEvent } from "react";
import type { MissionStatus } from "@/types/database";
import type { MissionView } from "@/services/mission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MissionFormData {
  title: string;
  description: string | null;
  priority: string | null;
  status: MissionStatus;
  due_date: string | null;
}

interface MissionFormProps {
  initialData?: MissionView | null;
  onSubmit: (data: MissionFormData) => Promise<void>;
  onCancel: () => void;
}

export function MissionForm({ initialData, onSubmit, onCancel }: MissionFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState(initialData?.priority || "");
  const [status, setStatus] = useState<MissionStatus>(initialData?.status || "IDEA");
  // Basic date handling for MVP
  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? initialData.due_date.substring(0, 10) : ""
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim() || null;
    const trimmedPriority = priority.trim() || null;
    const finalDueDate = dueDate ? new Date(dueDate).toISOString() : null;

    if (!trimmedTitle) {
      setError("Title is required.");
      setIsSaving(false);
      return;
    }
    if (trimmedTitle.length > 255) {
      setError("Title must be 255 characters or less.");
      setIsSaving(false);
      return;
    }

    try {
      await onSubmit({
        title: trimmedTitle,
        description: trimmedDesc,
        priority: trimmedPriority,
        status,
        due_date: finalDueDate,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSaving}
          placeholder="e.g. Implement Auth"
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Mission goals and details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MissionStatus)}
            disabled={isSaving}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="IDEA">Idea</option>
            <option value="PLANNING">Planning</option>
            <option value="APPROVAL">Approval</option>
            <option value="EXECUTION">Execution</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">Priority</label>
          <Input
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. High"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="due_date" className="text-sm font-medium">Due Date</label>
        <Input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isSaving}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create Mission"}
        </Button>
      </div>
    </form>
  );
}
