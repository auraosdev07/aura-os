import { NextResponse } from "next/server";
import { ToolOrchestrator } from "@/services/tools/tool-orchestrator";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId required" }, { status: 400 });
    }

    const executions = await ToolOrchestrator.getTaskToolExecutions(taskId);
    return NextResponse.json({ success: true, executions });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch tool executions";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
