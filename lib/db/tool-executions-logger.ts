import { getServerContext } from "@/lib/auth/get-server-context";

export async function logToolExecutionDb(record: {
  task_id: string | null;
  agent_id: string;
  tool_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: string;
  attempt_count: number;
  execution_time_ms: number;
  error_message: string | null;
}) {
  if (typeof window !== "undefined") return;
  try {
    const { supabase } = await getServerContext();
    if (!supabase) return;

    await supabase.from("tool_executions").insert(record);

    let targetTaskId = record.task_id;
    if (!targetTaskId && record.agent_id) {
      const { data: runningTask } = await supabase
        .from("tasks")
        .select("id")
        .eq("assigned_agent_id", record.agent_id)
        .eq("status", "IN_PROGRESS")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (runningTask) targetTaskId = runningTask.id;
    }

    if (targetTaskId) {
      await supabase.from("task_events").insert({
        task_id: targetTaskId,
        agent_id: record.agent_id,
        event_type: record.status === "SUCCESS" ? "TOOL_EXECUTION_COMPLETED" : "TOOL_EXECUTION_FAILED",
        message: `Tool '${record.tool_name}' (${record.tool_id}) ${record.status === "SUCCESS" ? "completed" : "failed"} (${record.execution_time_ms}ms).`,
        details: { toolId: record.tool_id, status: record.status, executionTimeMs: record.execution_time_ms, attempts: record.attempt_count },
      });
    }

    if (record.agent_id) {
      await supabase.from("agent_logs").insert({
        agent_id: record.agent_id,
        level: record.status === "SUCCESS" ? "INFO" : "ERROR",
        event_type: record.status === "SUCCESS" ? "TOOL_EXECUTION_COMPLETED" : "TOOL_EXECUTION_FAILED",
        message: `Tool '${record.tool_name}' (${record.tool_id}) executed in ${record.execution_time_ms}ms with status ${record.status}.`,
        details: {
          tool_id: record.tool_id,
          input: record.input,
          output: record.output,
          execution_time_ms: record.execution_time_ms,
          status: record.status,
        },
      });
    }
  } catch (err) {
    console.error("[TOOL EXECUTION DB LOG ERROR]:", err);
  }
}

export async function logToolEventDb(
  taskId: string | null,
  agentId: string | null,
  eventType: string,
  message: string,
  details: Record<string, unknown>
) {
  if (typeof window !== "undefined") return;
  try {
    const { supabase } = await getServerContext();
    if (!supabase) return;

    let targetTaskId = taskId;
    if (!targetTaskId && agentId) {
      const { data: runningTask } = await supabase
        .from("tasks")
        .select("id")
        .eq("assigned_agent_id", agentId)
        .eq("status", "IN_PROGRESS")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (runningTask) targetTaskId = runningTask.id;
    }

    if (targetTaskId) {
      await supabase.from("task_events").insert({
        task_id: targetTaskId,
        agent_id: agentId || null,
        event_type: eventType,
        message,
        details,
      });
    }

    if (agentId) {
      await supabase.from("agent_logs").insert({
        agent_id: agentId,
        level: eventType.includes("FAILED") ? "ERROR" : "INFO",
        event_type: eventType,
        message,
        details,
      });
    }
  } catch (err) {
    console.error("[TOOL EVENT DB LOG ERROR]:", err);
  }
}

export async function fetchTaskToolExecutionsDb(taskId: string) {
  if (typeof window !== "undefined") return [];
  try {
    const { supabase } = await getServerContext();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("tool_executions")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
