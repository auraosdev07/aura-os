import { NextResponse } from "next/server";
import { opportunityEngine } from "@/services/growth/opportunity-engine/orchestrator";

export async function GET() {
  try {
    const opportunities = await opportunityEngine.detectOpportunities();
    return NextResponse.json({ success: true, opportunities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
