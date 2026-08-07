/**
 * services/website-sync/preview-builder.ts
 *
 * Generates side-by-side visual diff (Old vs New) highlighting Added, Removed, Changed fields.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { detectManualWebsiteEdits } from "./change-detector";
import type { PreviewResult, ResourceType, SyncDiffField } from "./types";

export async function buildSyncPreview(
  resourceType: ResourceType,
  resourceId: string,
  proposedUpdates: Record<string, unknown>
): Promise<PreviewResult> {
  const { supabase } = await getServerContext();
  const diffs: SyncDiffField[] = [];

  let liveRecord: Record<string, unknown> = {};

  if (supabase && typeof supabase.from === "function") {
    try {
      if (resourceType === "PRODUCT") {
        const { data } = await supabase.from("products").select("*").eq("id", resourceId).maybeSingle();
        if (data) liveRecord = data;
      } else if (resourceType === "BLOG") {
        const { data } = await supabase.from("article_drafts").select("*").eq("id", resourceId).maybeSingle();
        if (data) liveRecord = data;
      } else if (resourceType === "SEO_METADATA") {
        const { data } = await supabase.from("product_seo_profiles").select("*").eq("product_id", resourceId).maybeSingle();
        if (data) liveRecord = data;
      }
    } catch (err) {
      console.error("[PREVIEW BUILDER FETCH ERROR]:", err);
    }
  }

  // Detect Manual Edits
  const manualEdits = await detectManualWebsiteEdits(resourceType, resourceId, proposedUpdates);

  // Compare Fields
  for (const key of Object.keys(proposedUpdates)) {
    const oldVal = liveRecord[key];
    const newVal = proposedUpdates[key];

    if (oldVal === undefined) {
      diffs.push({ fieldName: key, oldValue: null, newValue: newVal, status: "ADDED" });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ fieldName: key, oldValue: oldVal, newValue: newVal, status: "CHANGED" });
    } else {
      diffs.push({ fieldName: key, oldValue: oldVal, newValue: newVal, status: "UNCHANGED" });
    }
  }

  const changedCount = diffs.filter((d) => d.status === "ADDED" || d.status === "CHANGED").length;

  return {
    resourceType,
    resourceId,
    hasManualEdits: manualEdits.hasManualEdits,
    manualEditWarning: manualEdits.warningMessage,
    diffs,
    changedCount,
  };
}
