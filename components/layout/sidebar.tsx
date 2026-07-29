"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { AuraBrand } from "@/components/brand/aura-logo";
import { NAVIGATION, type NavItem, type NavSection } from "@/config/navigation";

/* ──────────────────────────────────────────────────────────────
   Individual nav item
────────────────────────────────────────────────────────────── */
function SidebarNavItem({
  href,
  label,
  icon: Icon,
  exactMatch = false,
  disabled,
  collapsed,
}: NavItem & { collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = exactMatch
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  if (disabled) {
    return (
      <div
        title={collapsed ? label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
          "text-sm font-medium transition-all duration-200",
          "text-sidebar-foreground/30 cursor-not-allowed",
          collapsed && "justify-center px-0",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-sidebar-foreground/30" />
        {!collapsed && <span className="truncate leading-none">{label}</span>}
        {/* Hover tooltip when collapsed */}
        {collapsed && (
          <div
            className={cn(
              "pointer-events-none absolute left-full z-50 ml-3",
              "flex items-center whitespace-nowrap rounded-md px-2.5 py-1.5",
              "bg-popover text-popover-foreground text-xs font-medium shadow-lg border border-border",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            )}
          >
            {label} (Coming Soon)
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
        "text-sm font-medium transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "nav-active text-sidebar-primary"
          : "text-sidebar-foreground/70",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground",
        )}
      />

      {!collapsed && (
        <span className="truncate leading-none">{label}</span>
      )}

      {/* Active indicator pip when collapsed */}
      {collapsed && isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1 rounded-l-full bg-sidebar-primary" />
      )}

      {/* Hover tooltip when collapsed */}
      {collapsed && (
        <div
          className={cn(
            "pointer-events-none absolute left-full z-50 ml-3",
            "flex items-center whitespace-nowrap rounded-md px-2.5 py-1.5",
            "bg-popover text-popover-foreground text-xs font-medium shadow-lg border border-border",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          )}
        >
          {label}
        </div>
      )}
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────────
   Nav section
────────────────────────────────────────────────────────────── */
function SidebarNavSection({
  label,
  items,
  collapsed,
}: NavSection & { collapsed: boolean }) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
          {label}
        </p>
      )}
      {items.map((item) => (
        <SidebarNavItem key={item.href} {...item} collapsed={collapsed} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sidebar
────────────────────────────────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[280px]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ── Logo header ── */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-0" : "justify-between px-4",
          )}
        >
          <AuraBrand collapsed={collapsed} />

          {!collapsed && (
            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className={cn(
                "hidden lg:flex h-7 w-7 items-center justify-center rounded-md",
                "text-sidebar-foreground/40 hover:text-sidebar-foreground",
                "hover:bg-sidebar-accent transition-colors",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Navigation — driven by NAVIGATION config ── */}
        <nav
          className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4 space-y-5"
          aria-label="Sidebar navigation"
        >
          {NAVIGATION.map((section) => (
            <SidebarNavSection
              key={section.label}
              {...section}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* ── Collapsed expand toggle (bottom) ── */}
        {collapsed && (
          <div className="shrink-0 flex justify-center border-t border-sidebar-border py-3">
            <button
              onClick={onToggle}
              aria-label="Expand sidebar"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                "text-sidebar-foreground/40 hover:text-sidebar-foreground",
                "hover:bg-sidebar-accent transition-colors",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Version tag ── */}
        {!collapsed && (
          <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
            <p className="text-[10px] text-sidebar-foreground/30 select-none">
              Aura OS v0.1.0 · Alpha
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
