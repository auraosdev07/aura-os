"use client";

import { History, TrendingUp, TrendingDown, Clock } from "lucide-react";
import type { InventoryLogRow } from "@/types/database";

interface InventoryLogViewerProps {
  logs: InventoryLogRow[];
}

export function InventoryLogViewer({ logs }: InventoryLogViewerProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-6 text-center border border-slate-800 rounded-xl bg-slate-950 text-slate-400 text-xs">
        <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
        No inventory adjustment logs recorded yet. Changes in stock will be automatically audited here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
        <History className="w-4 h-4 text-emerald-400" /> Inventory Audit Trail Logs ({logs.length})
      </h4>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-900 text-xs">
          {logs.map((log) => {
            const isIncrease = log.change_quantity > 0;
            return (
              <div key={log.id} className="flex items-center justify-between p-3 hover:bg-slate-900/50">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isIncrease ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">
                      Reason: <span className="text-emerald-400">{log.reason}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-200">
                    {log.before_quantity} &rarr; {log.after_quantity}
                  </div>
                  <div
                    className={`text-[11px] font-mono font-medium ${
                      isIncrease ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isIncrease ? `+${log.change_quantity}` : log.change_quantity} units
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
