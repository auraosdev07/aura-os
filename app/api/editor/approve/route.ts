/**
 * app/api/editor/approve/route.ts
 */

import { NextResponse } from "next/server";
import { approveEditorialDraft } from "@/services/editorial/editorial-orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { queueId, reviewer = "Human Editor" } = body;

    if (!queueId) {
      return NextResponse.json({ error: "Missing 'queueId' parameter." }, { status: 400 });
    }

    const success = await approveEditorialDraft(queueId, reviewer);
    return NextResponse.json({ success, message: "Draft approved successfully for publishing." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
