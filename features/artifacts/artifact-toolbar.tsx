"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ArtifactToolbarProps {
  onSearch: (query: string) => void;
  onNew: () => void;
}

export function ArtifactToolbar({ onSearch, onNew }: ArtifactToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search artifacts..."
          className="pl-9"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button onClick={onNew} className="ml-auto sm:ml-0">
          Upload Artifact
        </Button>
      </div>
    </div>
  );
}
