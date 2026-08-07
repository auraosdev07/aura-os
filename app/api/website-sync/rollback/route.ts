import { NextResponse } from "next/server";
import { rollbackWebsiteSync } from "@/services/website-sync/rollback-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { resourceType, resourceId, snapshotId } = body;

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: "Missing required 'resourceType' or 'resourceId'." }, { status: 400 });
    }

    const result = await rollbackWebsiteSync(resourceType, resourceId, snapshotId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
