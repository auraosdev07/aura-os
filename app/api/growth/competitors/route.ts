import { NextResponse } from "next/server";
import { competitorIntelligenceEngine } from "@/services/growth/competitor-engine/orchestrator";

export async function GET() {
  try {
    const competitors = await competitorIntelligenceEngine.getCompetitorProfiles();
    const snapshots = await competitorIntelligenceEngine.getRecentCompetitorSnapshots();
    return NextResponse.json({ success: true, competitors, snapshots });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
