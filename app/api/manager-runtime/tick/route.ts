import { NextResponse } from "next/server";
import { runManagerRuntimeTick, getManagerRuntimeStatus } from "@/services/manager-runtime";

export async function GET() {
  try {
    const summary = await runManagerRuntimeTick();
    const status = await getManagerRuntimeStatus();
    return NextResponse.json({ success: true, summary, status });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
