import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
   PlaceholderCard
   A generic empty container used as a slot placeholder.
   Pass children to fill it in; leave empty to show a shimmer.
────────────────────────────────────────────────────────────── */
interface PlaceholderCardProps {
  className?: string;
  children?: React.ReactNode;
  /** Aspect ratio hint – used when no explicit height is set */
  aspect?: "auto" | "square" | "video";
}

export function PlaceholderCard({
  className,
  children,
  aspect = "auto",
}: PlaceholderCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card",
        "shadow-[0_1px_4px_oklch(0_0_0/6%)] hover:shadow-[0_4px_16px_oklch(0_0_0/8%)]",
        "transition-shadow duration-200",
        aspect === "square" && "aspect-square",
        aspect === "video" && "aspect-video",
        className,
      )}
    >
      {children ?? (
        /* Empty shimmer pattern */
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full bg-gradient-to-br from-muted/30 to-muted/10" />
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SectionHeader
   Reusable section title + optional action slot.
────────────────────────────────────────────────────────────── */
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   StatCard
   A metric display card with a label, value, and optional badge.
────────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "blue" | "violet" | "emerald" | "amber" | "rose";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  blue:    "from-[oklch(0.68_0.20_264)/12%] text-[oklch(0.55_0.22_264)]",
  violet:  "from-[oklch(0.60_0.24_290)/12%] text-[oklch(0.52_0.24_290)]",
  emerald: "from-[oklch(0.70_0.18_155)/12%] text-[oklch(0.52_0.18_155)]",
  amber:   "from-[oklch(0.82_0.18_80)/12%]  text-[oklch(0.62_0.18_60)]",
  rose:    "from-[oklch(0.68_0.22_15)/12%]  text-[oklch(0.55_0.22_15)]",
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "blue",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border",
        "bg-card px-5 py-4",
        "shadow-[0_1px_4px_oklch(0_0_0/6%)]",
        "hover:shadow-[0_4px_16px_oklch(0_0_0/8%)] transition-shadow duration-200",
      )}
    >
      {/* Soft radial gradient accent in top-right */}
      <div
        className={cn(
          "absolute -top-4 -right-4 h-24 w-24 rounded-full blur-2xl opacity-60",
          `bg-gradient-to-br ${accentClasses[accent]}`,
        )}
        aria-hidden="true"
      />

      {/* Icon + label row */}
      <div className="flex items-center gap-2">
        {icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br to-transparent", `${accentClasses[accent]}`)}>
            {icon}
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {sub && (
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   ListPlaceholder
   An empty table / list skeleton placeholder.
────────────────────────────────────────────────────────────── */
export function ListPlaceholder({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="h-7 w-7 rounded-md bg-muted/60 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div
              className="h-2.5 rounded bg-muted/80"
              style={{ width: `${55 + (i % 3) * 15}%` }}
            />
            <div
              className="h-2 rounded bg-muted/50"
              style={{ width: `${30 + (i % 4) * 10}%` }}
            />
          </div>
          <div className="h-5 w-14 rounded-full bg-muted/60 shrink-0" />
        </div>
      ))}
    </div>
  );
}
