/**
 * services/website-sync/orchestrator.ts
 *
 * Master Orchestrator for Phase 5.2 Website Sync Engine.
 * Reuses existing production Supabase tables (`products`, `article_drafts`, `product_seo_profiles`).
 * Reuses Editorial Queue approval verification (`status` === 'Approved').
 */

import { syncProductToWebsite } from "./product-sync";
import { syncBlogToWebsite } from "./blog-sync";
import { syncSEOMetadataToWebsite } from "./seo-sync";
import { syncSchemaToWebsite } from "./schema-sync";
import { buildSyncPreview } from "./preview-builder";
import { rollbackWebsiteSync } from "./rollback-engine";
import { detectManualWebsiteEdits } from "./change-detector";
import { validateSyncPrerequisites } from "./validator";
import type { ResourceType, SyncResult } from "./types";

export async function executeWebsiteSync(
  resourceType: ResourceType,
  resourceId: string,
  updates: Record<string, unknown>,
  editorialQueueId?: string
): Promise<SyncResult> {
  // 1. PRE-SYNC VALIDATION
  const validation = await validateSyncPrerequisites(resourceType, resourceId, editorialQueueId);

  if (!validation.isValid) {
    return {
      success: false,
      jobId: "sync_blocked_unapproved",
      resourceType,
      resourceId,
      previousVersion: 1,
      newVersion: 1,
      updatedFields: [],
      errorMessage: validation.errors.join("; "),
    };
  }

  // 2. DISPATCH TO SPECIFIC SYNC ADAPTER
  if (resourceType === "PRODUCT") {
    return syncProductToWebsite(resourceId, updates, editorialQueueId);
  } else if (resourceType === "BLOG") {
    return syncBlogToWebsite(articleIdOrResource(resourceId), updates, "Published", editorialQueueId);
  } else if (resourceType === "SEO_METADATA") {
    return syncSEOMetadataToWebsite(resourceId, updates, editorialQueueId);
  } else if (resourceType === "SCHEMA") {
    return syncSchemaToWebsite(resourceId, [updates], editorialQueueId);
  }

  return {
    success: false,
    jobId: "unknown_resource",
    resourceType,
    resourceId,
    previousVersion: 1,
    newVersion: 1,
    updatedFields: [],
    errorMessage: `Unsupported resource type: ${resourceType}`,
  };
}

function articleIdOrResource(id: string) { return id; }

export { buildSyncPreview, rollbackWebsiteSync, detectManualWebsiteEdits, validateSyncPrerequisites };
