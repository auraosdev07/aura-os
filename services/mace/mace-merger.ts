"use server";

/**
 * services/mace/mace-merger.ts
 *
 * Multi-Agent Collaboration Engine (MACE) v1 Merge Engine (Phase 1 Production)
 * Combines completed child task outputs, structured reasoning, deliverables, and artifacts
 * into a consolidated final deliverable package stored in `merged_outputs` table.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { TaskRow, MergedOutputRow } from "@/types/task";
import type { TaskOutputRow } from "@/types/task-output";

export async function mergeMaceChildOutputs(
  parentTaskId: string,
  childTasks: TaskRow[]
): Promise<MergedOutputRow | null> {
  console.log("Merge started");
  const { supabase } = await getServerContext();

  // Log Timeline: MERGE_STARTED
  await supabase.from("task_events").insert({
    task_id: parentTaskId,
    event_type: "MERGE_STARTED",
    message: `MACE Merge Engine started synthesizing ${childTasks.length} child subtasks.`,
    details: { parentTaskId, subtasksCount: childTasks.length },
  });

  const childIds = childTasks.map((t) => t.id);

  // 1. Fetch parent task details
  const { data: parentTask } = await supabase
    .from("tasks")
    .select("title, description")
    .eq("id", parentTaskId)
    .single();

  const title = parentTask?.title
    ? `MACE Final Deliverable: ${parentTask.title}`
    : `MACE Final Deliverable #${parentTaskId.substring(0, 8)}`;

  // 2. Fetch structured outputs from task_outputs for all child subtasks
  const { data: rawTaskOutputs } = await supabase
    .from("task_outputs")
    .select(`
      *,
      agent:agents(id, name, role)
    `)
    .in("task_id", childIds);

  const taskOutputsMap = new Map<string, TaskOutputRow>();
  if (rawTaskOutputs) {
    for (const out of rawTaskOutputs as TaskOutputRow[]) {
      taskOutputsMap.set(out.task_id, out);
    }
  }

  // 3. Fetch all artifacts from task_artifacts for all child subtasks
  const { data: artifacts } = await supabase
    .from("task_artifacts")
    .select("id, title, content_or_url, task_id, artifact_type, created_at")
    .in("task_id", childIds);

  const totalArtifactsCount = (artifacts || []).length;
  const allNextSteps: string[] = [];

  // 4. Construct rich consolidated deliverable report
  const sections: string[] = [
    `# ${title}`,
    `**Parent Mission Goal**: ${parentTask?.description || parentTask?.title || "N/A"}`,
    `**Engine**: Multi-Agent Collaboration Engine (MACE) v1`,
    `**Synthesized Subtasks**: ${childTasks.length}`,
    `**Merged Artifacts**: ${totalArtifactsCount}`,
    `**Consolidated At**: ${new Date().toISOString()}`,
    `\n---\n`,
    `## Executive Summary`,
  ];

  // Synthesize Executive Summaries
  for (const child of childTasks) {
    const out = taskOutputsMap.get(child.id);
    const agentName = out?.agent?.name || "Assigned Agent";
    const summaryText = out?.summary || child.description || "Subtask completed successfully.";
    sections.push(`- **${child.title}** (${agentName}): ${summaryText}`);

    const jsonOut = out?.json_output as { next_steps?: string[] } | undefined;
    if (jsonOut?.next_steps && Array.isArray(jsonOut.next_steps)) {
      allNextSteps.push(...jsonOut.next_steps);
    }
  }

  sections.push(`\n---\n`, `## Individual Agent Results & Deliverables`);

  for (const child of childTasks) {
    const out = taskOutputsMap.get(child.id);
    const agentName = out?.agent?.name || "Agent";
    const agentRole = out?.agent?.role || "Specialist";

    sections.push(`### ${child.title}`);
    sections.push(`- **Executed By**: ${agentName} (${agentRole})`);
    sections.push(`- **Status**: ${child.status}`);
    sections.push(`- **Completed At**: ${child.completed_at || "N/A"}`);

    if (out?.reasoning) {
      sections.push(`\n#### Operational Reasoning\n${out.reasoning}`);
    }

    if (out?.output) {
      sections.push(`\n#### Detailed Output\n${out.output}`);
    }

    // Attach subtask artifacts
    const subArtifacts = (artifacts || []).filter((a) => a.task_id === child.id);
    if (subArtifacts.length > 0) {
      sections.push(`\n#### Subtask Deliverables & Artifacts`);
      for (const art of subArtifacts) {
        sections.push(`##### ${art.title} (${art.artifact_type})`);
        sections.push(`\`\`\`\n${art.content_or_url}\n\`\`\``);
      }
    }

    sections.push(`\n---\n`);
  }

  // Recommendations & Next Steps
  sections.push(`## Consolidated Recommendations & Next Steps`);
  if (allNextSteps.length > 0) {
    const uniqueSteps = Array.from(new Set(allNextSteps));
    for (const step of uniqueSteps) {
      sections.push(`- [ ] ${step}`);
    }
  } else {
    sections.push(`- [ ] Verify integrated output deliverables against business metrics.`);
    sections.push(`- [ ] Execute downstream operational deployments.`);
  }

  const mergedContent = sections.join("\n");
  const summary = `Successfully merged ${childTasks.length} child subtasks and ${totalArtifactsCount} artifacts into a final MACE deliverable package.`;

  // 5. Insert record into merged_outputs table
  const { data: mergedRecord, error: mergeErr } = await supabase
    .from("merged_outputs")
    .insert({
      parent_task_id: parentTaskId,
      title,
      summary,
      merged_content: mergedContent,
      child_task_ids: childIds,
      artifacts_count: totalArtifactsCount,
    })
    .select("*")
    .single();

  if (mergeErr) {
    console.error("Insert merged_outputs FAILED");
  } else {
    console.log("Insert merged_outputs SUCCESS");
  }

  // 6. Save consolidated document in task_artifacts
  await supabase.from("task_artifacts").insert({
    task_id: parentTaskId,
    title: "MACE Final Merged Deliverable Package",
    artifact_type: "document",
    content_or_url: mergedContent,
    metadata: {
      mergedOutputId: mergedRecord?.id,
      childTaskIds: childIds,
      artifactsCount: totalArtifactsCount,
      maceVersion: "v1",
    },
  });

  // Log Timeline: MERGE_COMPLETED
  await supabase.from("task_events").insert({
    task_id: parentTaskId,
    event_type: "MERGE_COMPLETED",
    message: `MACE Merge Engine successfully created Merged Deliverable Package (${totalArtifactsCount} artifacts consolidated).`,
    details: { mergedOutputId: mergedRecord?.id, totalArtifactsCount },
  });

  return (mergedRecord as MergedOutputRow) || null;
}
