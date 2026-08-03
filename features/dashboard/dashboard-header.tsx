"use client";

import Link from "next/link";
import { RefreshCw, Radio, AlertCircle, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  isConnected: boolean;
  fetchedAt: string;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  isConnected,
  fetchedAt,
  loading,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-emerald-400" /> Aura & Soul Executive Dashboard
          </h1>

          {isConnected ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>LIVE DATA — Aura & Soul</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-4 h-4" />
              <span>NOT CONNECTED</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Live business operations, product catalog metrics, inventory alerts, and sales performance.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {fetchedAt && (
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            Updated {new Date(fetchedAt).toLocaleTimeString()}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-colors disabled:opacity-50"
          title="Refresh live metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
        </button>

        {!isConnected && (
          <Link
            href="/integrations/aura-soul"
            className="text-xs px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors"
          >
            Configure DB Connection →
          </Link>
        )}
      </div>
    </div>
  );
}
