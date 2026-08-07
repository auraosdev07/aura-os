"use server";

/**
 * services/multi-agent/merge-results.ts
 *
 * Multi-Agent Result Merging Service
 * Consolidates output deliverables, artifacts, and execution notes
 * from all finished child subtasks into a unified parent task artifact.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { TaskRow } from "@/types/task";

export async function mergeSubtaskResultsIntoParent(
  parentTaskId: string,
  childTasks: TaskRow[]
): Promise<string> {
  const { supabase } = await getServerContext();

  const childIds = childTasks.map((t) => t.id);

  // Fetch child task outputs from task_outputs
  const { data: rawOutputs } = await supabase
    .from("task_outputs")
    .select(`
      *,
      agent:agents(id, name, role)
    `)
    .in("task_id", childIds);

  const outputsMap = new Map<string, { summary: string; reasoning: string | null; output: string; agentName: string }>();
  if (rawOutputs) {
    for (const out of rawOutputs as Array<{ task_id: string; summary: string; reasoning: string | null; output: string; agent?: { name: string } }>) {
      outputsMap.set(out.task_id, {
        summary: out.summary,
        reasoning: out.reasoning,
        output: out.output,
        agentName: out.agent?.name || "Agent",
      });
    }
  }

  // Fetch child artifacts
  const { data: artifacts } = await supabase
    .from("task_artifacts")
    .select("title, content_or_url, task_id, created_at")
    .in("task_id", childIds);

  const sections: string[] = [
    `# Multi-Agent Consolidated Execution Report`,
    `Parent Task ID: ${parentTaskId}`,
    `Total Subtasks Completed: ${childTasks.length}`,
    `Generated At: ${new Date().toISOString()}`,
    `\n---\n`,
  ];

  for (const child of childTasks) {
    const outData = outputsMap.get(child.id);
    sections.push(`## Subtask: ${child.title}`);
    sections.push(`Executed By: ${outData?.agentName || "Assigned Agent"}`);
    sections.push(`Status: ${child.status}`);
    sections.push(`Completed At: ${child.completed_at || "N/A"}`);

    if (outData?.summary) {
      sections.push(`\n### Summary\n${outData.summary}`);
    }

    if (outData?.reasoning) {
      sections.push(`\n### Reasoning\n${outData.reasoning}`);
    }

    const childArtifacts = (artifacts || []).filter((a) => a.task_id === child.id);
    if (childArtifacts.length > 0) {
      sections.push(`\n### Artifacts & Deliverables:`);
      for (const art of childArtifacts) {
        sections.push(`**${art.title}**:`);
        sections.push(art.content_or_url || "(No preview text)");
      }
    }
    sections.push(`\n---\n`);
  }

  const consolidatedContent = sections.join("\n");

  // Save consolidated parent artifact
  await supabase.from("task_artifacts").insert({
    task_id: parentTaskId,
    title: "Consolidated Multi-Agent Deliverable Report",
    artifact_type: "document",
    content_or_url: consolidatedContent,
    metadata: {
      subtasksCount: childTasks.length,
      mergedAt: new Date().toISOString(),
    },
  });

  return consolidatedContent;
}
