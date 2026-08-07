"use client";

import React from "react";
import type { SyncDiffField } from "@/services/website-sync/types";

export interface ProfessionalDiffViewerProps {
  diffs: SyncDiffField[];
  hasManualEdits?: boolean;
  warningMessage?: string;
}

export function ProfessionalDiffViewer({ diffs, hasManualEdits, warningMessage }: ProfessionalDiffViewerProps) {
  return (
    <div className="space-y-4 font-sans select-none">
      {hasManualEdits && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 font-medium flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>{warningMessage || "Website has manual edits. Review required before syncing."}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-200">Side-by-Side Visual Diff Inspector</span>
          <span className="font-mono text-indigo-400">{diffs.filter((d) => d.status !== "UNCHANGED").length} Fields Changed</span>
        </div>

        <div className="divide-y divide-slate-850">
          {diffs.map((diff, idx) => (
            <div key={idx} className="p-3.5 hover:bg-slate-950/50 transition-all space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-indigo-300 text-[11px]">{diff.fieldName}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    diff.status === "CHANGED"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : diff.status === "ADDED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : diff.status === "REMOVED"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {diff.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                {/* OLD / CURRENT VALUE */}
                <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded text-rose-300/90 overflow-x-auto space-y-1">
                  <div className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">OLD (Live Website)</div>
                  <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(diff.oldValue, null, 2) || "(null / empty)"}</pre>
                </div>

                {/* NEW / PROPOSED VALUE */}
                <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded text-emerald-300/90 overflow-x-auto space-y-1">
                  <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">NEW (Aura OS Generated)</div>
                  <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(diff.newValue, null, 2)}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
