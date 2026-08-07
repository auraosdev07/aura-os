import { NextResponse } from "next/server";
import { alertEngine } from "@/services/growth/alert-engine/orchestrator";

export async function GET() {
  try {
    const alerts = await alertEngine.getRecentAlerts();
    return NextResponse.json({ success: true, alerts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
