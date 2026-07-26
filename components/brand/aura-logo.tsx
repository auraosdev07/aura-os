"use client";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
   Aura OS Logo Mark
   A stylised "A" with a gradient background — used in the sidebar.
────────────────────────────────────────────────────────────── */
export function AuraLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-lg",
        "bg-gradient-to-br from-[oklch(0.68_0.20_264)] to-[oklch(0.55_0.27_300)]",
        "shadow-[0_2px_12px_oklch(0.68_0.20_264/35%)]",
        className,
      )}
    >
      {/* Stylised glowing dot */}
      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white/60" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 text-white"
        aria-hidden="true"
      >
        <path
          d="M12 3L3 20h18L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line
          x1="7"
          y1="15"
          x2="17"
          y2="15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Full Brand Wordmark  (Logo + "Aura OS" text)
────────────────────────────────────────────────────────────── */
export function AuraBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <AuraLogo />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-tight gradient-text">
            Aura OS
          </span>
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            AI Operating System
          </span>
        </div>
      )}
    </div>
  );
}
