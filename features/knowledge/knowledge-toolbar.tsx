"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { KnowledgeLayer } from "@/types/database";

interface KnowledgeToolbarProps {
  onSearch: (query: string) => void;
  onFilterLayer: (layer: KnowledgeLayer | "ALL") => void;
  currentLayer: KnowledgeLayer | "ALL";
  onNew: () => void;
}

export function KnowledgeToolbar({
  onSearch,
  onFilterLayer,
  currentLayer,
  onNew,
}: KnowledgeToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge..."
          className="pl-9"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <select
          value={currentLayer}
          onChange={(e) => onFilterLayer(e.target.value as KnowledgeLayer | "ALL")}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ALL">All Layers</option>
          <option value="COMPANY">Company</option>
          <option value="PROJECT">Project</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        
        <Button onClick={onNew} className="ml-auto sm:ml-0">
          New Entry
        </Button>
      </div>
    </div>
  );
}
