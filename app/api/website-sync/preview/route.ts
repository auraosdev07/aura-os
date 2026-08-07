import { NextResponse } from "next/server";
import { buildSyncPreview } from "@/services/website-sync/preview-builder";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { resourceType, resourceId, updates } = body;

    if (!resourceType || !resourceId || !updates) {
      return NextResponse.json({ error: "Missing required 'resourceType', 'resourceId', or 'updates'." }, { status: 400 });
    }

    const preview = await buildSyncPreview(resourceType, resourceId, updates);
    return NextResponse.json({ success: true, preview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
