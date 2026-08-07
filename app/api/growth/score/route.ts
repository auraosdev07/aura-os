import { NextResponse } from "next/server";
import { growthScoringEngine } from "@/services/growth/growth-score/orchestrator";

export async function GET() {
  try {
    const growthScore = growthScoringEngine.calculateGrowthScore();
    return NextResponse.json({ success: true, growthScore });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
