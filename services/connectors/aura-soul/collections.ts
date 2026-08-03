"use server";

/**
 * services/connectors/aura-soul/collections.ts
 *
 * READ-ONLY Collection querying from external Aura & Soul database.
 * Collections may not exist in all Aura & Soul schema versions — handled gracefully.
 */

import { getAuraSoulExternalClient } from "./connection";
import type { CollectionRow } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/** READ ONLY: Fetch collections list from external Aura & Soul database. */
export async function getCollections(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CollectionRow[]> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { data, error } = await client
    .from("collections")
    .select("*")
    .order("title", { ascending: true });

  // Table may not exist in this schema version — return empty gracefully
  if (error) return [];
  return data || [];
}
