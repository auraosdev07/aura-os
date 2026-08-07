import { NextResponse } from "next/server";
import { trendIntelligenceEngine } from "@/services/growth/trend-engine/orchestrator";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "Gems & Jewelry";
    const trends = await trendIntelligenceEngine.aggregateAndMergeTrends(category);
    return NextResponse.json({ success: true, trends });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
