import { NextResponse } from "next/server";
import { runExecutionEngineTick } from "@/services/execution-engine";

export async function GET() {
  try {
    const result = await runExecutionEngineTick();
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
