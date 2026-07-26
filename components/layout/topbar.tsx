"use client";

import { Bell, Sun, Moon, Menu, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search/search-bar";
import { useTheme, type Theme } from "@/providers/theme-provider";

/* ──────────────────────────────────────────────────────────────
   Icon Button — generic rounded icon action
────────────────────────────────────────────────────────────── */
function IconButton({
  children,
  label,
  badge,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  badge?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg",
        "border border-border bg-card text-muted-foreground",
        "hover:bg-accent hover:text-accent-foreground hover:border-border/80",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   Theme Toggle — functional, wired to ThemeProvider
────────────────────────────────────────────────────────────── */
const THEME_OPTIONS: { value: Theme; icon: React.ElementType; label: string }[] =
  [
    { value: "light",  icon: Sun,     label: "Light mode"  },
    { value: "system", icon: Monitor, label: "System mode" },
    { value: "dark",   icon: Moon,    label: "Dark mode"   },
  ];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme toggle"
      className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5"
    >
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            "transition-all duration-150",
            theme === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   User Avatar Placeholder
────────────────────────────────────────────────────────────── */
function UserAvatar() {
  return (
    <button
      id="user-menu-trigger"
      aria-label="Open user menu"
      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
    >
      <div
        className={cn(
          "h-7 w-7 rounded-full shrink-0",
          "bg-gradient-to-br from-[oklch(0.68_0.20_264)] to-[oklch(0.55_0.27_300)]",
          "flex items-center justify-center",
        )}
      >
        <span className="text-[11px] font-bold text-white select-none">A</span>
      </div>
      <div className="hidden xl:flex flex-col items-start leading-none">
        <span className="text-xs font-semibold text-foreground">Admin User</span>
        <span className="text-[10px] text-muted-foreground">admin@aura.os</span>
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   Top Bar
────────────────────────────────────────────────────────────── */
interface TopbarProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

export function Topbar({ onMenuClick, pageTitle }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4",
        "border-b border-border bg-background/80 backdrop-blur-md",
        "px-4 md:px-6",
      )}
    >
      {/* Mobile menu toggle */}
      <button
        id="mobile-menu-toggle"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
        className={cn(
          "flex lg:hidden h-9 w-9 items-center justify-center rounded-lg",
          "border border-border text-muted-foreground hover:bg-accent hover:text-foreground",
          "transition-colors",
        )}
      >
        <Menu className="h-4 w-4" />
      </button>

      {pageTitle && (
        <h1 className="hidden md:block text-sm font-semibold text-foreground/80 truncate">
          {pageTitle}
        </h1>
      )}

      <div className="flex-1" />

      {/* ── Right cluster ── */}
      <div className="flex items-center gap-2">
        <SearchBar />

        <IconButton label="Notifications" badge>
          <Bell className="h-4 w-4" />
        </IconButton>

        <ThemeToggle />

        <div className="hidden sm:block h-6 w-px bg-border mx-1" aria-hidden="true" />

        <UserAvatar />
      </div>
    </header>
  );
}
