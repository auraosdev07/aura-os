"use client";

import { useState, useEffect, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import { 
  getEmployees, 
  getArchivedEmployees, 
  createEmployee, 
  updateEmployee, 
  archiveEmployee, 
  restoreEmployee, 
  type EmployeeView} from "@/services/employee";
import type { EmployeeFilters } from "@/lib/db/queries";
// We need to import getManagers from a client-safe service to get the active managers list.
// The user specified that "Manager dropdown must come through the service layer."
// And "Do NOT bypass services."
import { getManagers } from "@/services/manager";

import { EmployeeTable } from "./employee-table";
import { EmployeeDialog } from "./employee-dialog";
import { EmployeeForm, type EmployeeFormData } from "./employee-form";
import { EmployeeToolbar } from "./employee-toolbar";
import { Button } from "@/components/ui/button";

export function EmployeeFeature() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeView[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [viewArchived, setViewArchived] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeView | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: EmployeeFilters = {
        search: search.trim() || undefined,
      };

      const [empData, mgrData] = await Promise.all([
        viewArchived ? getArchivedEmployees(filters) : getEmployees(filters),
        getManagers()
      ]);
      
      setEmployees(empData);
      setManagers(mgrData.map(m => ({ id: m.id, name: m.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees.");
    } finally {
      setIsLoading(false);
    }
  }, [search, viewArchived]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(data: EmployeeFormData) {
    await createEmployee({ ...data, avatar: null, notes: null, performance: null });
    await loadData();
    setIsCreateOpen(false);
    showToast("Employee created successfully");
    router.refresh();
  }

  async function handleEdit(data: EmployeeFormData) {
    if (!editingEmployee) return;
    await updateEmployee(editingEmployee.id, data);
    await loadData();
    setEditingEmployee(null);
    showToast("Employee updated successfully");
    router.refresh();
  }

  async function handleArchive(employee: EmployeeView) {
    try {
      await archiveEmployee(employee.id);
      await loadData();
      showToast("Employee archived");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to archive employee", "error");
    }
    router.refresh();
  }

  async function handleRestore(employee: EmployeeView) {
    try {
      await restoreEmployee(employee.id);
      await loadData();
      showToast("Employee restored");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to restore employee", "error");
    }
    router.refresh();
  }

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-destructive'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <EmployeeToolbar 
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
        <EmployeeTable 
          employees={employees} 
          onEdit={setEditingEmployee}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      )}

      <EmployeeDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Create Employee"
      >
        <EmployeeForm 
          managers={managers}
          onSubmit={handleCreate} 
          onCancel={() => setIsCreateOpen(false)} 
        />
      </EmployeeDialog>

      <EmployeeDialog 
        isOpen={!!editingEmployee} 
        onClose={() => setEditingEmployee(null)}
        title="Edit Employee"
      >
        <EmployeeForm 
          initialData={editingEmployee}
          managers={managers}
          onSubmit={handleEdit} 
          onCancel={() => setEditingEmployee(null)} 
        />
      </EmployeeDialog>
    </div>
  );
}
