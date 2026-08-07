/**
 * services/website-sync/seo-sync.ts
 *
 * SEO Metadata Sync Module for Phase 5.2.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { createWebsiteSnapshot } from "./rollback-engine";
import { validateSyncPrerequisites } from "./validator";
import type { SyncResult } from "./types";

export async function syncSEOMetadataToWebsite(
  productId: string,
  updates: Record<string, unknown>,
  editorialQueueId?: string
): Promise<SyncResult> {
  const validation = await validateSyncPrerequisites("SEO_METADATA", productId, editorialQueueId);
  if (!validation.isValid) {
    return {
      success: false,
      jobId: "failed_job",
      resourceType: "SEO_METADATA",
      resourceId: productId,
      previousVersion: 1,
      newVersion: 1,
      updatedFields: [],
      errorMessage: validation.errors.join("; "),
    };
  }

  const { supabase } = await getServerContext();
  const updatedFields = Object.keys(updates);
  const snapshotId = await createWebsiteSnapshot("SEO_METADATA", productId, 1);

  if (supabase && typeof supabase.from === "function") {
    try {
      await supabase.from("products").update(updates).eq("id", productId);

      await supabase.from("sync_history").insert({
        resource_type: "SEO_METADATA",
        resource_id: productId,
        action: "UPDATE_PARTIAL",
        previous_version: 1,
        new_version: 2,
        synced_by: "Aura OS Website Sync Engine",
        diff_summary: { updatedFields },
      });
    } catch (err) {
      console.error("[SEO SYNC DB ERROR]:", err);
    }
  }

  return {
    success: true,
    jobId: `job_seo_${productId}`,
    resourceType: "SEO_METADATA",
    resourceId: productId,
    previousVersion: 1,
    newVersion: 2,
    updatedFields,
    snapshotId,
  };
}
