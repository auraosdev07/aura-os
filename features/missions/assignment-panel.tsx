"use client";

import { useState, useEffect, useCallback } from "react";
import { getManagers, type ManagerView } from "@/services/manager";
import { getEmployees, type EmployeeView } from "@/services/employee";
import { 
  getMissionAssignmentsList, 
  assignManager, 
  assignEmployee, 
  removeManager, 
  removeEmployee,
  type MissionView
} from "@/services/mission";
import type { MissionAssignmentRow } from "@/types/database";

import { AssignedManagerList } from "./assigned-manager-list";
import { AssignedEmployeeList } from "./assigned-employee-list";
import { AssignManagerDialog } from "./assign-manager-dialog";
import { AssignEmployeeDialog } from "./assign-employee-dialog";

interface AssignmentPanelProps {
  mission: MissionView;
}

export function AssignmentPanel({ mission }: AssignmentPanelProps) {
  const [managers, setManagers] = useState<ManagerView[]>([]);
  const [employees, setEmployees] = useState<EmployeeView[]>([]);
  const [assignments, setAssignments] = useState<MissionAssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mgrs, emps, assigns] = await Promise.all([
        getManagers(),
        getEmployees(),
        getMissionAssignmentsList(mission.id)
      ]);
      setManagers(mgrs);
      setEmployees(emps);
      setAssignments(assigns);
    } catch (err) {
      console.error("Failed to load assignment data", err);
    } finally {
      setIsLoading(false);
    }
  }, [mission.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const assignedManagerIds = new Set(
    assignments.filter(a => a.target_type === 'MANAGER').map(a => a.manager_id)
  );
  const assignedEmployeeIds = new Set(
    assignments.filter(a => a.target_type === 'EMPLOYEE').map(a => a.employee_id)
  );

  const assignedManagers = managers.filter(m => assignedManagerIds.has(m.id));
  const assignedEmployees = employees.filter(e => assignedEmployeeIds.has(e.id));

  const availableManagers = managers.filter(m => !assignedManagerIds.has(m.id));
  const availableEmployees = employees.filter(e => !assignedEmployeeIds.has(e.id));

  async function handleAssignManager(managerId: string) {
    const res = await assignManager(mission.id, managerId);
    if (!res.success) throw new Error(res.error);
    await loadData();
  }

  async function handleAssignEmployee(employeeId: string) {
    const res = await assignEmployee(mission.id, employeeId);
    if (!res.success) throw new Error(res.error);
    await loadData();
  }

  async function handleRemoveManager(managerId: string) {
    // Optimistic UI could be implemented here, but reload is safer for MVP
    const res = await removeManager(mission.id, managerId);
    if (!res.success) alert(res.error);
    await loadData();
  }

  async function handleRemoveEmployee(employeeId: string) {
    const res = await removeEmployee(mission.id, employeeId);
    if (!res.success) alert(res.error);
    await loadData();
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-muted/20 rounded"></div>
        <div className="h-24 bg-muted/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-6 text-foreground">Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <AssignedManagerList 
            managers={assignedManagers} 
            onRemove={handleRemoveManager}
            onAssignClick={() => setIsManagerDialogOpen(true)}
          />
          <AssignedEmployeeList 
            employees={assignedEmployees} 
            onRemove={handleRemoveEmployee}
            onAssignClick={() => setIsEmployeeDialogOpen(true)}
          />
        </div>
      </div>

      <AssignManagerDialog 
        isOpen={isManagerDialogOpen}
        onClose={() => setIsManagerDialogOpen(false)}
        availableManagers={availableManagers}
        onAssign={handleAssignManager}
      />

      <AssignEmployeeDialog 
        isOpen={isEmployeeDialogOpen}
        onClose={() => setIsEmployeeDialogOpen(false)}
        availableEmployees={availableEmployees}
        onAssign={handleAssignEmployee}
      />
    </div>
  );
}
