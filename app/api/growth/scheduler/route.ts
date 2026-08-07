import { NextResponse } from "next/server";
import { schedulerEngine } from "@/services/growth/scheduler-engine/orchestrator";

export async function GET() {
  try {
    const jobs = await schedulerEngine.getScheduledJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing jobId" }, { status: 400 });
    }
    const runResult = await schedulerEngine.triggerManualRun(jobId);
    return NextResponse.json({ success: true, runResult });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
