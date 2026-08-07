"use server";

/**
 * services/task-output.ts
 *
 * Service layer for storing and retrieving standardized task outputs & AI deliverables.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { AgentStructuredOutput, TaskOutputRow } from "@/types/task-output";

export async function createTaskOutput(
  taskId: string,
  agentId: string | null,
  structuredOutput: AgentStructuredOutput
): Promise<TaskOutputRow> {
  const { supabase } = await getServerContext();

  const { data, error } = await supabase
    .from("task_outputs")
    .insert({
      task_id: taskId,
      agent_id: agentId,
      summary: structuredOutput.summary || "Task execution completed.",
      reasoning: structuredOutput.reasoning || null,
      output: structuredOutput.output || "",
      json_output: structuredOutput,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[CREATE TASK OUTPUT ERROR]:", error);
    throw new Error(`Create Task Output Error: ${error.message}`);
  }

  // Auto-insert any generated artifacts into task_artifacts table
  if (structuredOutput.artifacts && structuredOutput.artifacts.length > 0) {
    for (const art of structuredOutput.artifacts) {
      if (!art.title || !art.content) continue;
      try {
        await supabase.from("task_artifacts").insert({
          task_id: taskId,
          title: art.title,
          artifact_type: art.type || "DOCUMENT",
          content_or_url: art.content,
        });

        // Log timeline event for artifact creation
        await supabase.from("task_events").insert({
          task_id: taskId,
          agent_id: agentId,
          event_type: "ARTIFACT_CREATED",
          message: `Artifact created: '${art.title}' (${art.type || "DOCUMENT"})`,
          details: { title: art.title, type: art.type },
        });
      } catch (artErr) {
        console.error("[AUTO ARTIFACT INSERT ERROR]:", artErr);
      }
    }
  }

  return data as TaskOutputRow;
}

export async function getTaskOutput(taskId: string): Promise<TaskOutputRow | null> {
  try {
    const { supabase } = await getServerContext();

    const { data, error } = await supabase
      .from("task_outputs")
      .select(`
        *,
        agent:agents(id, name, role)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as TaskOutputRow) || null;
  } catch {
    return null;
  }
}

export async function getTaskOutputsForAgent(agentId: string): Promise<TaskOutputRow[]> {
  try {
    const { supabase } = await getServerContext();

    const { data, error } = await supabase
      .from("task_outputs")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as TaskOutputRow[]) || [];
  } catch {
    return [];
  }
}
