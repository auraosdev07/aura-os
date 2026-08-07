import { NextResponse } from "next/server";
import { dailyCEOBriefEngine } from "@/services/growth/daily-brief/orchestrator";

export async function GET() {
  try {
    const report = await dailyCEOBriefEngine.generateDailyBrief();
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
