/**
 * config/navigation.ts
 *
 * Single source of truth for all sidebar navigation in Aura OS.
 * Unified Enterprise Operating System Navigation Structure.
 */

import {
  LayoutDashboard,
  Crosshair,
  Bot,
  CheckSquare,
  BookOpen,
  FolderOpen,
  Database,
  Wrench,
  Settings,
  User,
  Users,
  Sparkles,
  Package,
  Plug,
  Cpu,
  Search,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Gem,
  type LucideIcon,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exactMatch?: boolean;
  disabled?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/* ── Navigation config ──────────────────────────────────────── */

export const NAVIGATION: NavSection[] = [
  {
    label: "Main OS",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        exactMatch: true,
      },
      { href: "/runtime",  label: "Runtime Control", icon: Cpu },
      { href: "/ai", label: "AI Workspace", icon: Sparkles },
      { href: "/products", label: "Products", icon: Package },
      { href: "/integrations", label: "Integrations", icon: Plug },
    ],
  },
  {
    label: "SEO & Content Engine",
    items: [
      { href: "/seo-workspace", label: "SEO Workspace", icon: Search },
      { href: "/product-seo",   label: "Product SEO",  icon: Gem },
      { href: "/editor",        label: "Editorial Queue", icon: ShieldCheck },
      { href: "/quality-assurance", label: "Quality Assurance", icon: ShieldAlert },
    ],
  },
  {
    label: "Website & Sync",
    items: [
      { href: "/website-sync",  label: "Website Sync",  icon: Globe },
    ],
  },
  {
    label: "Agents & Missions",
    items: [
      { href: "/managers", label: "Managers", icon: Users },
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/missions", label: "Missions", icon: Crosshair },
      { href: "/agents",   label: "Agents",   icon: Bot },
      { href: "/tasks",    label: "Tasks",    icon: CheckSquare },
    ],
  },
  {
    label: "Knowledge & Assets",
    items: [
      { href: "/knowledge", label: "Knowledge", icon: BookOpen },
      { href: "/artifacts", label: "Artifacts", icon: FolderOpen },
      { href: "/memory",    label: "Memory",    icon: Database },
      { href: "/tools",     label: "Tools",     icon: Wrench },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile",  label: "Profile",  icon: User },
      { href: "/settings", label: "Settings", icon: Settings, disabled: true },
    ],
  },
];
