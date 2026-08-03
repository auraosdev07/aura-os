"use server";

/**
 * services/connectors/aura-soul/connection.ts
 *
 * Secure connection factory for Aura & Soul external database.
 * Reads stored credentials dynamically from the `integrations` table.
 */

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerContext } from "@/lib/auth/get-server-context";
import { queryGetIntegrationBySlug } from "@/lib/db/integrations-queries";
import type { AuraSoulConfig } from "@/types/integrations";

export interface ExternalConnectionResult {
  client: SupabaseClient;
  config: AuraSoulConfig;
}

/**
 * Dynamically instantiates a Supabase client targeting the external Aura & Soul database.
 */
export async function getAuraSoulExternalClient(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ExternalConnectionResult> {
  let supabaseCtx: SupabaseClient;
  let ownerId: string;

  if (clientOverride) {
    supabaseCtx = clientOverride;
    ownerId = userIdOverride || "dev-user-id";
  } else {
    const ctx = await getServerContext();
    supabaseCtx = ctx.supabase;
    ownerId = ctx.user.id;
  }

  const integration = await queryGetIntegrationBySlug(supabaseCtx, "aura-soul", ownerId);

  if (!integration) {
    throw new Error(
      "Aura & Soul integration is not configured. Please add connection credentials at /integrations/aura-soul."
    );
  }

  const config = integration.config as unknown as AuraSoulConfig;

  if (!config.supabase_url || !config.service_role_key) {
    throw new Error(
      "Aura & Soul integration credentials are incomplete. Please update Supabase URL and Service Role Key at /integrations/aura-soul."
    );
  }

  try {
    const client = createSupabaseClient(config.supabase_url, config.service_role_key, {
      auth: { persistSession: false },
    });
    return { client, config };
  } catch (err: unknown) {
    throw new Error(`Failed to initialize external database client: ${(err as Error).message}`);
  }
}
