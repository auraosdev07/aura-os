"use server";

/**
 * services/connectors/aura-soul/schema.ts
 *
 * READ-ONLY database schema introspection for external Aura & Soul database.
 *
 * Uses the PostgREST REST API directly with the service_role key to query
 * information_schema and pg_stat_user_tables — no modifications to the
 * external database are made.
 */

import { getAuraSoulExternalClient } from "./connection";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SchemaColumn {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
  character_maximum_length: number | null;
  udt_name: string;
}

export interface SchemaTable {
  table_name: string;
  table_schema: string;
  estimated_row_count: number;
  columns: SchemaColumn[];
  has_updated_at: boolean;
  last_updated_sample: string | null;
}

export interface DatabaseSchemaResult {
  tables: SchemaTable[];
  fetched_at: string;
  project_url: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Call PostgREST REST API directly for system schema access.
 * The Supabase JS client's .from() only targets the `public` schema by
 * default; system tables require direct REST calls with proper headers.
 */
async function postgrestFetch<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string
): Promise<T[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostgREST query failed [${res.status}]: ${body}`);
  }

  return res.json() as Promise<T[]>;
}

/**
 * Fetch approximate row counts from pg_stat_user_tables via RPC.
 * Falls back to 0 if not accessible.
 */
async function fetchRowCounts(
  client: SupabaseClient
): Promise<Record<string, number>> {
  try {
    const { data, error } = await client.rpc("get_table_row_counts");
    if (error || !data) return {};
    const map: Record<string, number> = {};
    for (const row of data as { table_name: string; row_count: number }[]) {
      map[row.table_name] = row.row_count;
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Fetch pg_stat_user_tables directly for row estimates — preferred over full COUNT(*).
 */
async function fetchPgStatCounts(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<Record<string, number>> {
  try {
    const rows = await postgrestFetch<{ relname: string; n_live_tup: number }>(
      supabaseUrl,
      serviceRoleKey,
      "pg_stat_user_tables?select=relname,n_live_tup&schemaname=eq.public"
    );
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.relname] = Number(row.n_live_tup) || 0;
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Sample the latest `updated_at` timestamp for a given table.
 * Completely read-only, only reads one row.
 */
async function fetchLastUpdated(
  client: SupabaseClient,
  tableName: string
): Promise<string | null> {
  try {
    const { data } = await client
      .from(tableName)
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    return (data as { updated_at: string } | null)?.updated_at ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

/**
 * Introspects the external Aura & Soul database schema.
 * READ ONLY — no INSERT / UPDATE / DELETE.
 */
export async function getExternalDatabaseSchema(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<DatabaseSchemaResult> {
  const { client, config } = await getAuraSoulExternalClient(clientOverride, userIdOverride);
  const { supabase_url, service_role_key } = config;

  // 1. Fetch all public tables from information_schema
  const rawTables = await postgrestFetch<{
    table_name: string;
    table_schema: string;
    table_type: string;
  }>(
    supabase_url,
    service_role_key,
    "information_schema.tables?select=table_name,table_schema,table_type&table_schema=eq.public&table_type=eq.BASE TABLE&order=table_name"
  );

  if (!rawTables || rawTables.length === 0) {
    return { tables: [], fetched_at: new Date().toISOString(), project_url: supabase_url };
  }

  // 2. Fetch all column metadata for public schema
  const rawColumns = await postgrestFetch<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: "YES" | "NO";
    column_default: string | null;
    character_maximum_length: number | null;
    udt_name: string;
  }>(
    supabase_url,
    service_role_key,
    "information_schema.columns?select=table_name,column_name,data_type,is_nullable,column_default,character_maximum_length,udt_name&table_schema=eq.public&order=table_name,ordinal_position"
  );

  // 3. Fetch estimated row counts from pg_stat_user_tables
  const rowCounts = await fetchPgStatCounts(supabase_url, service_role_key);
  // Fallback to RPC if pg_stat not accessible
  const rpcCounts = Object.keys(rowCounts).length === 0
    ? await fetchRowCounts(client)
    : {};
  const allCounts = { ...rpcCounts, ...rowCounts };

  // 4. Group columns by table
  const columnsByTable: Record<string, SchemaColumn[]> = {};
  for (const col of rawColumns) {
    if (!columnsByTable[col.table_name]) columnsByTable[col.table_name] = [];
    columnsByTable[col.table_name].push({
      column_name: col.column_name,
      data_type: col.data_type,
      is_nullable: col.is_nullable,
      column_default: col.column_default,
      character_maximum_length: col.character_maximum_length,
      udt_name: col.udt_name,
    });
  }

  // 5. Fetch last_updated for tables that have updated_at
  const tables: SchemaTable[] = await Promise.all(
    rawTables.map(async (t) => {
      const cols = columnsByTable[t.table_name] || [];
      const hasUpdatedAt = cols.some((c) => c.column_name === "updated_at");
      const last_updated_sample = hasUpdatedAt
        ? await fetchLastUpdated(client, t.table_name)
        : null;

      return {
        table_name: t.table_name,
        table_schema: t.table_schema,
        estimated_row_count: allCounts[t.table_name] ?? 0,
        columns: cols,
        has_updated_at: hasUpdatedAt,
        last_updated_sample,
      };
    })
  );

  return {
    tables,
    fetched_at: new Date().toISOString(),
    project_url: supabase_url,
  };
}
