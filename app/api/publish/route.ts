/**
 * app/api/publish/route.ts
 */

import { NextResponse } from "next/server";
import { publishApprovedContent } from "@/services/editorial/editorial-orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { queueId, providerId = "markdown-export", humanApprover = "Human Editor" } = body;

    if (!queueId) {
      return NextResponse.json({ error: "Missing 'queueId' parameter." }, { status: 400 });
    }

    const result = await publishApprovedContent(queueId, providerId, humanApprover);

    if (!result.success) {
      return NextResponse.json({ error: result.errorMessage }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
