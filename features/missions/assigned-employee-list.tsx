"use client";

import { Button } from "@/components/ui/button";
import type { EmployeeView } from "@/services/employee";

interface AssignedEmployeeListProps {
  employees: EmployeeView[];
  onRemove: (employeeId: string) => void;
  onAssignClick: () => void;
}

export function AssignedEmployeeList({ employees, onRemove, onAssignClick }: AssignedEmployeeListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Employees</h3>
        <Button variant="outline" size="sm" onClick={onAssignClick}>
          + Assign
        </Button>
      </div>
      
      {employees.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed p-8 text-center bg-muted/5">
          <p className="text-sm text-muted-foreground">No employees assigned to this mission.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map(employee => (
            <div 
              key={employee.id} 
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors"
            >
              <div>
                <div className="font-medium text-sm text-foreground">{employee.name}</div>
                <div className="text-xs text-muted-foreground">{employee.role} &middot; {employee.department}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(employee.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
