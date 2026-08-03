"use client";

import { BarChart2, DollarSign, ShoppingBag, Info } from "lucide-react";
import type { ChartDayPoint } from "@/types/dashboard";

interface DashboardSalesChartProps {
  data: ChartDayPoint[];
  hasData: boolean;
}

export function DashboardSalesChart({ data, hasData }: DashboardSalesChartProps) {
  if (!hasData || data.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">No Orders Data Available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            No order records were found in the connected Aura & Soul database for the past 7 days.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] text-slate-500 font-mono">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Chart will automatically populate when orders arrive</span>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  const total7DayRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const total7DayOrders = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" /> 7-Day Performance Trends
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Orders and revenue metrics over the last 7 calendar days.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">7D Revenue:</span>
            <span className="font-mono font-bold text-emerald-400">
              ₹{total7DayRevenue.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">7D Orders:</span>
            <span className="font-mono font-bold text-purple-400">{total7DayOrders}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 px-2">
          {data.map((day) => {
            const revHeightPct = Math.max(Math.round((day.revenue / maxRevenue) * 100), 6);
            const ordHeightPct = Math.max(Math.round((day.orders / maxOrders) * 100), 6);

            return (
              <div key={day.rawDate} className="flex flex-col items-center space-y-2 h-full justify-end group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-[10px] font-mono text-slate-200 px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap pointer-events-none mb-1">
                  ₹{day.revenue.toLocaleString()} ({day.orders} ord)
                </div>

                <div className="w-full flex items-end justify-center space-x-1 h-32">
                  {/* Revenue Bar */}
                  <div
                    style={{ height: `${revHeightPct}%` }}
                    className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all group-hover:brightness-125"
                    title={`Revenue: ₹${day.revenue}`}
                  />
                  {/* Orders Bar */}
                  <div
                    style={{ height: `${ordHeightPct}%` }}
                    className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all group-hover:brightness-125"
                    title={`Orders: ${day.orders}`}
                  />
                </div>

                <span className="text-[10px] font-mono text-slate-400 text-center truncate w-full">
                  {day.date.split(",")[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-[11px] text-slate-400 pt-2 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-emerald-400 rounded-sm inline-block" />
            <span>Revenue (₹)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-purple-400 rounded-sm inline-block" />
            <span>Order Count</span>
          </div>
        </div>
      </div>
    </div>
  );
}
