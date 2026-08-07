/**
 * app/api/editor/reject/route.ts
 */

import { NextResponse } from "next/server";
import { rejectEditorialDraft } from "@/services/editorial/editorial-orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { queueId, reason = "Quality criteria not met", reviewer = "Human Editor" } = body;

    if (!queueId) {
      return NextResponse.json({ error: "Missing 'queueId' parameter." }, { status: 400 });
    }

    const success = await rejectEditorialDraft(queueId, reason, reviewer);
    return NextResponse.json({ success, message: "Draft rejected successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
