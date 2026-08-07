import { NextResponse } from "next/server";
import { realtimeOpportunityQueue } from "@/services/growth/opportunity-queue/orchestrator";

export async function GET() {
  try {
    const queue = await realtimeOpportunityQueue.getQueuedOpportunities();
    return NextResponse.json({ success: true, queue });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
