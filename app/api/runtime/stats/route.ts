import { NextResponse } from "next/server";
import { getRuntimeStats, getRuntimeLogs } from "@/services/runtime-control";

export async function GET() {
  try {
    const [stats, logs] = await Promise.all([getRuntimeStats(), getRuntimeLogs()]);
    return NextResponse.json({ success: true, stats, logs });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch runtime stats";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
