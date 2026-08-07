/**
 * app/api/website-sync/route.ts
 * app/api/website-sync/preview/route.ts
 * app/api/website-sync/rollback/route.ts
 * app/api/website-sync/history/route.ts
 *
 * API Routes for Website Sync Engine.
 */

import { NextResponse } from "next/server";
import { executeWebsiteSync } from "@/services/website-sync/orchestrator";
import { getServerContext } from "@/lib/auth/get-server-context";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { resourceType, resourceId, updates, editorialQueueId } = body;

    if (!resourceType || !resourceId || !updates) {
      return NextResponse.json({ error: "Missing required 'resourceType', 'resourceId', or 'updates' parameters." }, { status: 400 });
    }

    const result = await executeWebsiteSync(resourceType, resourceId, updates, editorialQueueId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    const { supabase } = await getServerContext();
    if (!supabase || typeof supabase.from === "function") {
      return NextResponse.json({ success: true, jobs: [] });
    }

    let query = supabase.from("website_sync_jobs").select("*").order("created_at", { ascending: false }).limit(20);
    if (resourceId) query = query.eq("resource_id", resourceId);

    const { data: jobs } = await query;
    return NextResponse.json({ success: true, jobs: jobs || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
