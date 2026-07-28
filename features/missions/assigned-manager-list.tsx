"use client";

import { Button } from "@/components/ui/button";
import type { ManagerView } from "@/services/manager";

interface AssignedManagerListProps {
  managers: ManagerView[];
  onRemove: (managerId: string) => void;
  onAssignClick: () => void;
}

export function AssignedManagerList({ managers, onRemove, onAssignClick }: AssignedManagerListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Managers</h3>
        <Button variant="outline" size="sm" onClick={onAssignClick}>
          + Assign
        </Button>
      </div>
      
      {managers.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed p-8 text-center bg-muted/5">
          <p className="text-sm text-muted-foreground">No managers assigned to this mission.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {managers.map(manager => (
            <div 
              key={manager.id} 
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors"
            >
              <div>
                <div className="font-medium text-sm text-foreground">{manager.name}</div>
                <div className="text-xs text-muted-foreground">{manager.department}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(manager.id)}
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
