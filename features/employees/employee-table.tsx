"use client";

import type { EmployeeView } from "@/services/employee";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { Button } from "@/components/ui/button";

interface EmployeeTableProps {
  employees: EmployeeView[];
  onEdit: (employee: EmployeeView) => void;
  onArchive: (employee: EmployeeView) => void;
  onRestore: (employee: EmployeeView) => void;
}

export function EmployeeTable({ employees, onEdit, onArchive, onRestore }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/10 border border-border rounded-xl">
        <p className="text-lg font-medium text-foreground">No employees found</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Get started by adding a new employee.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Role & Dept</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Manager</th>
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((employee) => {
                const isArchived = employee.deleted_at !== null;
                return (
                  <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground truncate max-w-[200px]" title={employee.name}>
                        {employee.name}
                      </div>
                      {employee.email && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {employee.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{employee.role}</div>
                      <div className="text-xs text-muted-foreground">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <EmployeeStatusBadge status={employee.status} />
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {employee.managerName || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      <div>Missions: {employee.activeMissionCount}</div>
                      <div className="flex gap-2">
                        <span>A: {employee.artifactCount}</span>
                        <span>K: {employee.knowledgeCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEdit(employee)}
                        >
                          Edit
                        </Button>
                        {isArchived ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onRestore(employee)}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => onArchive(employee)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
