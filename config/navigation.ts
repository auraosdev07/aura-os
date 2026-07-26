/**
 * config/navigation.ts
 *
 * Single source of truth for all sidebar navigation.
 * Import this config wherever nav items need to be rendered.
 */

import {
  LayoutDashboard,
  Crosshair,
  Bot,
  CheckSquare,
  BookOpen,
  FolderOpen,
  Settings,
  type LucideIcon,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * When true, the item is only active on an exact pathname match.
   * When false (default), it matches any pathname that starts with `href`.
   */
  exactMatch?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/* ── Navigation config ──────────────────────────────────────── */

export const NAVIGATION: NavSection[] = [
  {
    label: "Main",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        exactMatch: true,
      },
      { href: "/missions", label: "Missions", icon: Crosshair },
      { href: "/agents",   label: "Agents",   icon: Bot },
      { href: "/tasks",    label: "Tasks",     icon: CheckSquare },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/knowledge",  label: "Knowledge",  icon: BookOpen },
      { href: "/artifacts",  label: "Artifacts",  icon: FolderOpen },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
