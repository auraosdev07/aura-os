import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

interface DataToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function DataToolbar({ search, onSearchChange, searchPlaceholder = "Search...", children }: DataToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <Input 
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      {children}
    </div>
  );
}
