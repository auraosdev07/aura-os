"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MissionToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  onCreateClick: () => void;
}

export function MissionToolbar({ search, onSearchChange, onCreateClick }: MissionToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Input
        placeholder="Search missions..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Button onClick={onCreateClick}>+ Add Mission</Button>
    </div>
  );
}
