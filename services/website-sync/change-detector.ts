/**
 * services/website-sync/change-detector.ts
 *
 * Compares live website production state with Aura OS generated state.
 * Detects manual edits on the live website and raises explicit warnings.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { ResourceType } from "./types";

export interface ChangeDetectionResult {
  hasManualEdits: boolean;
  warningMessage?: string;
  modifiedFields: string[];
}

export async function detectManualWebsiteEdits(
  resourceType: ResourceType,
  resourceId: string,
  proposedUpdates: Record<string, unknown>
): Promise<ChangeDetectionResult> {
  const { supabase } = await getServerContext();
  const modifiedFields: string[] = [];

  if (!supabase || typeof supabase.from !== "function") {
    return { hasManualEdits: false, modifiedFields: [] };
  }

  try {
    let currentLive: Record<string, unknown> | null = null;

    if (resourceType === "PRODUCT") {
      const { data } = await supabase.from("products").select("*").eq("id", resourceId).maybeSingle();
      currentLive = data;
    } else if (resourceType === "BLOG") {
      const { data } = await supabase.from("article_drafts").select("*").eq("id", resourceId).maybeSingle();
      currentLive = data;
    } else if (resourceType === "SEO_METADATA") {
      const { data } = await supabase.from("product_seo_profiles").select("*").eq("product_id", resourceId).maybeSingle();
      currentLive = data;
    }

    if (!currentLive) {
      return { hasManualEdits: false, modifiedFields: [] };
    }

    // Check if live website fields have manual edits that differ from original Aura OS baseline
    for (const key of Object.keys(proposedUpdates)) {
      if (currentLive[key] !== undefined && currentLive[key] !== proposedUpdates[key] && currentLive[key] !== null) {
        modifiedFields.push(key);
      }
    }

    if (modifiedFields.length > 0) {
      return {
        hasManualEdits: true,
        warningMessage: `Website has manual edits in fields: [${modifiedFields.join(", ")}]. Review required before overwriting.`,
        modifiedFields,
      };
    }
  } catch (err) {
    console.error("[CHANGE DETECTOR ERROR]:", err);
  }

  return { hasManualEdits: false, modifiedFields: [] };
}
