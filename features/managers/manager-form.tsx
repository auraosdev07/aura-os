"use client";

import { useState, type FormEvent } from "react";
import type { ManagerRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ManagerFormData {
  name: string;
  email: string;
  department: string;
}

interface ManagerFormProps {
  initialData?: ManagerRow | null;
  onSubmit: (data: ManagerFormData) => Promise<void>;
  onCancel: () => void;
}

export function ManagerForm({ initialData, onSubmit, onCancel }: ManagerFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDept = department.trim();

    if (!trimmedName) {
      setError("Name is required.");
      setIsSaving(false);
      return;
    }
    if (trimmedName.length > 100) {
      setError("Name must be 100 characters or less.");
      setIsSaving(false);
      return;
    }
    
    if (!trimmedEmail) {
      setError("Email is required.");
      setIsSaving(false);
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setIsSaving(false);
      return;
    }
    if (trimmedEmail.length > 255) {
      setError("Email must be 255 characters or less.");
      setIsSaving(false);
      return;
    }

    if (!trimmedDept) {
      setError("Department is required.");
      setIsSaving(false);
      return;
    }
    if (trimmedDept.length > 100) {
      setError("Department must be 100 characters or less.");
      setIsSaving(false);
      return;
    }

    try {
      await onSubmit({ name: trimmedName, email: trimmedEmail, department: trimmedDept });
    } catch (err) {
      // Handle unique constraint errors generically or specifically
      if (err instanceof Error) {
        if (err.message.includes("uq_managers_email") || err.message.includes("duplicate key")) {
          setError("A manager with this email already exists.");
        } else {
          setError(err.message);
        }
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
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
          placeholder="Jane Doe"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSaving}
          placeholder="jane@example.com"
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="department" className="text-sm font-medium">Department</label>
        <Input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          disabled={isSaving}
          placeholder="Engineering"
          maxLength={100}
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
          {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create Manager"}
        </Button>
      </div>
    </form>
  );
}
