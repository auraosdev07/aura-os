"use client";

import type { ReactNode } from "react";
import { AlertCircle, MinusCircle } from "lucide-react";
import type { MetricCardData } from "@/types/dashboard";

export type CardThemeColor =
  | "emerald"
  | "green"
  | "amber"
  | "yellow"
  | "rose"
  | "blue"
  | "purple"
  | "cyan";

interface DashboardKpiCardProps {
  title: string;
  metric: MetricCardData;
  icon: ReactNode;
  color?: CardThemeColor;
  subtitle?: string;
  loading?: boolean;
}

const colorStyles: Record<
  CardThemeColor,
  { iconBg: string; iconText: string; borderHover: string; valueText: string }
> = {
  emerald: {
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconText: "text-emerald-400",
    borderHover: "hover:border-emerald-500/40",
    valueText: "text-emerald-400",
  },
  green: {
    iconBg: "bg-green-500/10 border-green-500/20",
    iconText: "text-green-400",
    borderHover: "hover:border-green-500/40",
    valueText: "text-green-400",
  },
  amber: {
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconText: "text-amber-400",
    borderHover: "hover:border-amber-500/40",
    valueText: "text-amber-400",
  },
  yellow: {
    iconBg: "bg-yellow-500/10 border-yellow-500/20",
    iconText: "text-yellow-400",
    borderHover: "hover:border-yellow-500/40",
    valueText: "text-yellow-400",
  },
  rose: {
    iconBg: "bg-rose-500/10 border-rose-500/20",
    iconText: "text-rose-400",
    borderHover: "hover:border-rose-500/40",
    valueText: "text-rose-400",
  },
  blue: {
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconText: "text-blue-400",
    borderHover: "hover:border-blue-500/40",
    valueText: "text-blue-400",
  },
  purple: {
    iconBg: "bg-purple-500/10 border-purple-500/20",
    iconText: "text-purple-400",
    borderHover: "hover:border-purple-500/40",
    valueText: "text-purple-400",
  },
  cyan: {
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    iconText: "text-cyan-400",
    borderHover: "hover:border-cyan-500/40",
    valueText: "text-cyan-400",
  },
};

export function DashboardKpiCard({
  title,
  metric,
  icon,
  color = "emerald",
  subtitle,
  loading = false,
}: DashboardKpiCardProps) {
  const theme = colorStyles[color];

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-slate-800 rounded w-24" />
          <div className="w-8 h-8 rounded-xl bg-slate-800" />
        </div>
        <div className="h-7 bg-slate-800 rounded w-16" />
        <div className="h-2.5 bg-slate-800/60 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-2xl bg-slate-900 border border-slate-800 transition-all ${theme.borderHover} flex flex-col justify-between space-y-3 group`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${theme.iconBg} ${theme.iconText}`}
        >
          {icon}
        </div>
      </div>

      {/* Metric Value / Error / Unavailable */}
      <div>
        {metric.status === "success" ? (
          <div className={`text-2xl font-black font-mono tracking-tight ${theme.valueText}`}>
            {metric.value.toLocaleString()}
          </div>
        ) : metric.status === "error" ? (
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate" title={metric.error || "Query error"}>
              Error
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
            <MinusCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span>N/A</span>
          </div>
        )}

        {/* Subtitle / Footer */}
        {subtitle && (
          <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
