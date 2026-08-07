import { NextResponse } from "next/server";
import {
  runPlannerEngineTick,
  runManagerEngineTick,
  runExecutionEngineTickService,
  runMergeEngineTick,
  runFullOrchestrationTick,
} from "@/services/runtime-control";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    let result: Record<string, unknown> = {};

    switch (action) {
      case "planner":
        result = await runPlannerEngineTick();
        break;
      case "manager":
        result = await runManagerEngineTick();
        break;
      case "execution":
        result = await runExecutionEngineTickService();
        break;
      case "merge":
        result = await runMergeEngineTick();
        break;
      case "all":
        result = await runFullOrchestrationTick();
        break;
      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Runtime action execution error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
