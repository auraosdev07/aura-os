/**
 * lib/db/integrations-queries.ts
 *
 * Database queries & mutations for the Integrations framework.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationRow, IntegrationStatus } from "@/types/integrations";

export async function queryGetIntegrations(
  client: SupabaseClient,
  ownerId: string
): Promise<IntegrationRow[]> {
  const { data, error } = await client
    .from("integrations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function queryGetIntegrationBySlug(
  client: SupabaseClient,
  slug: string,
  ownerId: string
): Promise<IntegrationRow | null> {
  const { data, error } = await client
    .from("integrations")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function mutateUpsertIntegration(
  client: SupabaseClient,
  payload: {
    owner_id: string;
    slug: string;
    name: string;
    category: string;
    description?: string;
    icon_name?: string;
    status: IntegrationStatus;
    config: Record<string, unknown>;
    last_tested_at?: string | null;
    error_message?: string | null;
  }
): Promise<IntegrationRow> {
  const existing = await queryGetIntegrationBySlug(client, payload.slug, payload.owner_id);

  if (existing) {
    const { data, error } = await client
      .from("integrations")
      .update({
        name: payload.name,
        category: payload.category,
        description: payload.description || null,
        icon_name: payload.icon_name || "Plug",
        status: payload.status,
        config: payload.config,
        last_tested_at: payload.last_tested_at || null,
        error_message: payload.error_message || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await client
    .from("integrations")
    .insert({
      owner_id: payload.owner_id,
      slug: payload.slug,
      name: payload.name,
      category: payload.category,
      description: payload.description || null,
      icon_name: payload.icon_name || "Plug",
      status: payload.status,
      config: payload.config,
      last_tested_at: payload.last_tested_at || null,
      error_message: payload.error_message || null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
