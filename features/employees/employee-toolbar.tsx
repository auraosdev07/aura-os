"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EmployeeToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  onCreateClick: () => void;
}

export function EmployeeToolbar({ search, onSearchChange, onCreateClick }: EmployeeToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Input
        placeholder="Search employees..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Button onClick={onCreateClick}>+ Add Employee</Button>
    </div>
  );
}
