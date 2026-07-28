"use client";

import { useState, type FormEvent } from "react";
import type { EmployeeStatus } from "@/types/database";
import type { EmployeeView } from "@/services/employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EmployeeFormData {
  name: string;
  email: string | null;
  role: string;
  department: string;
  description: string | null;
  status: EmployeeStatus;
  manager_id: string | null;
}

interface EmployeeFormProps {
  initialData?: EmployeeView | null;
  managers: { id: string; name: string }[];
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeForm({ initialData, managers, onSubmit, onCancel }: EmployeeFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<EmployeeStatus>(initialData?.status || "IDLE");
  const [managerId, setManagerId] = useState<string>(initialData?.manager_id || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim() || null;
    const trimmedRole = role.trim();
    const trimmedDept = department.trim();
    const trimmedDesc = description.trim() || null;

    if (!trimmedName) {
      setError("Name is required.");
      setIsSaving(false);
      return;
    }
    if (trimmedName.length > 255) {
      setError("Name must be 255 characters or less.");
      setIsSaving(false);
      return;
    }

    if (trimmedEmail) {
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
    }

    if (!trimmedRole) {
      setError("Role is required.");
      setIsSaving(false);
      return;
    }

    if (!trimmedDept) {
      setError("Department is required.");
      setIsSaving(false);
      return;
    }

    try {
      await onSubmit({
        name: trimmedName,
        email: trimmedEmail,
        role: trimmedRole,
        department: trimmedDept,
        description: trimmedDesc,
        status,
        manager_id: managerId || null,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("uq_employees_active_email") || err.message.includes("duplicate key")) {
          setError("An active employee with this email already exists.");
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. AI Analyst Alpha"
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email (Optional)</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
            placeholder="alpha@agents.aura"
            maxLength={255}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">Role</label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. Data Scientist"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="department" className="text-sm font-medium">Department</label>
          <Input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. Engineering"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Employee capabilities and notes..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
            disabled={isSaving}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ACTIVE">Active</option>
            <option value="IDLE">Idle</option>
            <option value="ON_MISSION">On Mission</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="manager" className="text-sm font-medium">Assigned Manager</label>
          <select
            id="manager"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            disabled={isSaving}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- No Manager --</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
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
          {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
