"use server";

/**
 * services/connectors/aura-soul/categories.ts
 *
 * READ-ONLY Category querying from external Aura & Soul database.
 */

import { getAuraSoulExternalClient } from "./connection";
import type { CategoryRow } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/** READ ONLY: Fetch categories list from external Aura & Soul database. */
export async function getCategories(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CategoryRow[]> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`External Categories Error: ${error.message}`);
  return data || [];
}
