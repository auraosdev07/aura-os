"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Table2,
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  AlertCircle,
  CheckCircle2,
  Radio,
  RefreshCw,
} from "lucide-react";
import type { DatabaseSchemaResult, SchemaTable, SchemaColumn } from "@/services/connectors/aura-soul/schema";

interface DatabaseExplorerProps {
  schema: DatabaseSchemaResult | null;
  errorMessage: string | null;
  fetchedAt: string;
}

function formatDataType(col: SchemaColumn): string {
  if (col.data_type === "character varying" || col.data_type === "character") {
    return col.character_maximum_length ? `varchar(${col.character_maximum_length})` : "varchar";
  }
  if (col.data_type === "USER-DEFINED") return col.udt_name;
  return col.data_type;
}

function formatRowCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function TableCard({ table }: { table: SchemaTable }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all">
      {/* Table Header Row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
            <Table2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 font-mono">{table.table_name}</div>
            <div className="text-[11px] text-slate-500">{table.columns.length} columns</div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-slate-400">
          {/* Row Count */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Hash className="w-3 h-3 text-slate-500" />
            <span className="font-mono font-semibold text-slate-300">
              {formatRowCount(table.estimated_row_count)} rows
            </span>
          </div>

          {/* Last Updated */}
          {table.has_updated_at && table.last_updated_sample && (
            <div className="hidden sm:flex items-center space-x-1 text-slate-500">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{new Date(table.last_updated_sample).toLocaleDateString()}</span>
            </div>
          )}

          {/* Nullable badge */}
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Columns Table */}
      {open && (
        <div className="border-t border-slate-800">
          <table className="w-full text-xs">
            <thead className="bg-slate-950/80">
              <tr className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="px-4 py-2 text-left">Column</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Nullable</th>
                <th className="px-4 py-2 text-left hidden md:table-cell">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {table.columns.map((col) => (
                <tr key={col.column_name} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-2 font-mono font-semibold text-slate-200">
                    {col.column_name}
                    {col.column_name === "id" && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-sans font-semibold">PK</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-emerald-300 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded">
                      {formatDataType(col)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {col.is_nullable === "YES" ? (
                      <span className="text-slate-500">nullable</span>
                    ) : (
                      <span className="text-rose-400 font-semibold">not null</span>
                    )}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell font-mono text-[11px] text-slate-500 max-w-[200px] truncate">
                    {col.column_default ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AuraSoulDatabaseExplorer({ schema, errorMessage, fetchedAt }: DatabaseExplorerProps) {
  const [search, setSearch] = useState("");

  const filteredTables = (schema?.tables ?? []).filter((t) =>
    t.table_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/integrations/aura-soul"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 font-semibold mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Aura & Soul Settings</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-7 h-7 text-emerald-400" /> Database Explorer
              </h1>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>READ-ONLY LIVE SCHEMA</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live schema introspection from the external Aura & Soul database.
              No data is modified. This is the single source of truth.
            </p>
          </div>

          {/* Meta info */}
          {schema && (
            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500 font-mono flex-shrink-0">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {schema.tables.length} tables found
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Fetched {new Date(fetchedAt).toLocaleTimeString()}
              </span>
              <Link
                href="/integrations/aura-soul/database"
                className="flex items-center gap-1 text-emerald-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh schema
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMessage ? (
        <div className="p-8 border border-amber-500/30 rounded-2xl bg-amber-500/5 space-y-4">
          <div className="flex items-center space-x-3 text-amber-400">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h3 className="text-base font-bold">Cannot Connect to External Database</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{errorMessage}</p>
          <Link
            href="/integrations/aura-soul"
            className="inline-flex items-center space-x-2 text-xs px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors"
          >
            <span>Update Connection Credentials</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Tables", value: schema?.tables.length ?? 0, color: "emerald" },
              {
                label: "Total Columns",
                value: schema?.tables.reduce((s, t) => s + t.columns.length, 0) ?? 0,
                color: "blue",
              },
              {
                label: "Total Est. Rows",
                value: formatRowCount(
                  schema?.tables.reduce((s, t) => s + t.estimated_row_count, 0) ?? 0
                ),
                color: "purple",
              },
              { label: "Source of Truth", value: "Aura & Soul", color: "amber" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800"
              >
                <div className={`text-xl font-black font-mono text-${stat.color}-400`}>
                  {stat.value}
                </div>
                <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>

          {/* Tables list */}
          {filteredTables.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs border border-slate-800 rounded-2xl">
              No tables match &quot;{search}&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTables.map((table) => (
                <TableCard key={table.table_name} table={table} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
