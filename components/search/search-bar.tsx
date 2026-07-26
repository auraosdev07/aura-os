"use client";

/**
 * components/search/search-bar.tsx
 *
 * Global search input — extracted from topbar for reusability.
 */

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  return (
    <div className={cn("relative hidden sm:flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        id="global-search"
        type="search"
        placeholder="Search anything… (⌘K)"
        aria-label="Global search"
        className={cn(
          "h-9 w-60 xl:w-80 rounded-lg border border-border bg-muted/50",
          "pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/40",
          "transition-all duration-200",
        )}
      />
      <kbd className="pointer-events-none absolute right-2.5 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70 xl:flex">
        ⌘K
      </kbd>
    </div>
  );
}
