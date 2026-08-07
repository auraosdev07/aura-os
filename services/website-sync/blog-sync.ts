/**
 * services/website-sync/blog-sync.ts
 *
 * Blog Sync Module for Phase 5.2.
 * Supports Draft, Preview, and Published states.
 * AUTOMATIC PUBLISHING FORBIDDEN — Syncing as Published requires explicit Editorial Approval.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { createWebsiteSnapshot } from "./rollback-engine";
import { validateSyncPrerequisites } from "./validator";
import type { SyncResult } from "./types";

export async function syncBlogToWebsite(
  articleId: string,
  updates: Record<string, unknown>,
  targetState: "Draft" | "Preview" | "Published" = "Draft",
  editorialQueueId?: string
): Promise<SyncResult> {
  if (targetState === "Published") {
    const validation = await validateSyncPrerequisites("BLOG", articleId, editorialQueueId);
    if (!validation.isValid) {
      return {
        success: false,
        jobId: "failed_job",
        resourceType: "BLOG",
        resourceId: articleId,
        previousVersion: 1,
        newVersion: 1,
        updatedFields: [],
        errorMessage: validation.errors.join("; "),
      };
    }
  }

  const { supabase } = await getServerContext();
  const updatedFields = Object.keys(updates);

  // Snapshot before sync
  const snapshotId = await createWebsiteSnapshot("BLOG", articleId, 1);

  if (supabase && typeof supabase.from === "function") {
    try {
      await supabase.from("article_drafts").update({ ...updates, status: targetState }).eq("id", articleId);

      await supabase.from("sync_history").insert({
        resource_type: "BLOG",
        resource_id: articleId,
        action: targetState === "Published" ? "PUBLISH" : "UPDATE_PARTIAL",
        previous_version: 1,
        new_version: 2,
        synced_by: "Aura OS Website Sync Engine",
        diff_summary: { updatedFields, targetState },
      });
    } catch (err) {
      console.error("[BLOG SYNC DB ERROR]:", err);
    }
  }

  return {
    success: true,
    jobId: `job_blog_${articleId}`,
    resourceType: "BLOG",
    resourceId: articleId,
    previousVersion: 1,
    newVersion: 2,
    updatedFields,
    snapshotId,
  };
}
