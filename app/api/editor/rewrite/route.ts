/**
 * app/api/editor/rewrite/route.ts
 */

import { NextResponse } from "next/server";
import { rewritePartialSection } from "@/services/editorial/editorial-orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { queueId, sectionHeading, notes = "" } = body;

    if (!queueId || !sectionHeading) {
      return NextResponse.json({ error: "Missing 'queueId' or 'sectionHeading' parameter." }, { status: 400 });
    }

    const result = await rewritePartialSection(queueId, sectionHeading, notes);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
