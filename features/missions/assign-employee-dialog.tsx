"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { EmployeeView } from "@/services/employee";
import { cn } from "@/lib/utils";

interface AssignEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableEmployees: EmployeeView[];
  onAssign: (employeeId: string) => Promise<void>;
}

export function AssignEmployeeDialog({ 
  isOpen, 
  onClose, 
  availableEmployees, 
  onAssign 
}: AssignEmployeeDialogProps) {
  const [selectedId, setSelectedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId("");
       
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    
    setError(null);
    setIsSubmitting(true);
    try {
      await onAssign(selectedId);
      setSelectedId("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign employee");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "backdrop:bg-background/80 backdrop:backdrop-blur-sm",
        "bg-card text-card-foreground shadow-lg border border-border rounded-xl w-full max-w-md p-0",
        "open:animate-in open:fade-in-90 open:zoom-in-95"
      )}
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-xl font-semibold tracking-tight">Assign Employee</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1"
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 pt-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select an employee...</option>
                {availableEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                ))}
              </select>
            </div>
            
            {error && <div className="text-sm text-destructive">{error}</div>}
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedId}>
                {isSubmitting ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}
