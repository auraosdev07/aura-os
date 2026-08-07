import { NextResponse } from "next/server";
import { historicalAnalyticsEngine } from "@/services/growth/historical-analytics/orchestrator";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "Amethyst Healing Bracelet";
    const history = await historicalAnalyticsEngine.getTrendHistory(keyword);
    return NextResponse.json({ success: true, history });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
