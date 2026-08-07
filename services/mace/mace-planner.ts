"use server";

/**
 * services/mace/mace-planner.ts
 *
 * Multi-Agent Collaboration Engine (MACE) v1 Planner
 * Analyzes parent tasks and automatically decomposes them into DAG child subtasks
 * with explicit agent role requirements, parallel execution branches, and dependencies.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { createTask } from "@/services/task";
import type { TaskRow, TaskPriority, TaskStatus } from "@/types/task";

export interface MaceSubtaskPlan {
  titleSuffix: string;
  description: string;
  targetRole: string;
  executionOrder: number;
  dependsOnIndex: number | null;
  parallelBranch?: string;
}

export async function generateMacePlan(parentTitle: string): Promise<MaceSubtaskPlan[]> {
  return [
    {
      titleSuffix: "Market Research & SEO Audit",
      description: `Perform keyword research and SEO strategy audit for '${parentTitle}'.`,
      targetRole: "SEO",
      executionOrder: 1,
      dependsOnIndex: null,
      parallelBranch: "Branch-A",
    },
    {
      titleSuffix: "Competitor & Pricing Analytics",
      description: `Analyze market competitor pricing structures and catalog positioning for '${parentTitle}'.`,
      targetRole: "Marketing",
      executionOrder: 1,
      dependsOnIndex: null,
      parallelBranch: "Branch-B",
    },
    {
      titleSuffix: "Copywriting & Marketing Narrative",
      description: `Draft promotional copy and campaign text based on research for '${parentTitle}'.`,
      targetRole: "Marketing",
      executionOrder: 2,
      dependsOnIndex: 0, // Depends on SEO Audit
      parallelBranch: "Branch-A",
    },
    {
      titleSuffix: "Visual Banners & Graphic Assets",
      description: `Create banner graphics and high-resolution visuals for '${parentTitle}'.`,
      targetRole: "Designer",
      executionOrder: 2,
      dependsOnIndex: 1, // Depends on Competitor Analytics
      parallelBranch: "Branch-B",
    },
    {
      titleSuffix: "Product Page Layout & Integration",
      description: `Implement product page layout and dataset entry for '${parentTitle}'.`,
      targetRole: "Developer",
      executionOrder: 3,
      dependsOnIndex: 2, // Depends on Copywriting
      parallelBranch: "Main-Stream",
    },
    {
      titleSuffix: "QA Verification & Release Signoff",
      description: `Validate layout, test links, and approve deployment for '${parentTitle}'.`,
      targetRole: "Developer",
      executionOrder: 4,
      dependsOnIndex: 4, // Depends on Product Page
      parallelBranch: "Main-Stream",
    },
  ];
}

export interface MaceDecompositionResult {
  parentTaskId: string;
  childTasks: TaskRow[];
  totalChildTasks: number;
}

export async function decomposeParentTaskMace(
  parentTask: TaskRow
): Promise<MaceDecompositionResult> {
  console.log(`[MACE] Planner Start: Decomposing Parent Task ${parentTask.id} ('${parentTask.title}')...`);
  const { supabase } = await getServerContext();
  const planDefinitions = await generateMacePlan(parentTask.title);

  const createdChildTasks: TaskRow[] = [];
  const createdTaskIds: string[] = [];

  for (let i = 0; i < planDefinitions.length; i++) {
    const def = planDefinitions[i];
    const hasDependency = def.dependsOnIndex !== null && def.dependsOnIndex < i;
    const dependencyTaskId = hasDependency ? createdTaskIds[def.dependsOnIndex!] : null;

    // Subtask initial status: CREATED if no dependency (ready to run/assign in parallel), WAITING if waiting on prerequisite
    const initialStatus: TaskStatus = hasDependency ? "WAITING" : "CREATED";

    const childTask = await createTask({
      title: `${parentTask.title} - ${def.titleSuffix}`,
      description: def.description,
      priority: (parentTask.priority || "NORMAL") as TaskPriority,
      metadata: {
        parentTaskId: parentTask.id,
        targetRole: def.targetRole,
        executionOrder: def.executionOrder,
        dependsOnTaskId: dependencyTaskId,
        parallelBranch: def.parallelBranch,
        initialStatus,
      },
    });

    createdChildTasks.push(childTask);
    createdTaskIds.push(childTask.id);

    // Insert task_subtasks record
    await supabase.from("task_subtasks").insert({
      parent_task_id: parentTask.id,
      child_task_id: childTask.id,
      dependency_task_id: dependencyTaskId,
      execution_order: def.executionOrder,
    });

    // Log SUBTASK_CREATED event
    await supabase.from("task_events").insert({
      task_id: parentTask.id,
      event_type: "SUBTASK_CREATED",
      message: `MACE subtask created: ${childTask.title} (${def.parallelBranch || "Sequential"})`,
      details: {
        childTaskId: childTask.id,
        targetRole: def.targetRole,
        executionOrder: def.executionOrder,
        dependencyTaskId,
        parallelBranch: def.parallelBranch,
      },
    });
  }

  console.log(`[MACE] Planner Finish: Created ${createdChildTasks.length} subtasks for Parent Task ${parentTask.id}. Status set to WAITING.`);

  // Set parent task status to WAITING
  await supabase
    .from("tasks")
    .update({
      status: "WAITING",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parentTask.id);

  return {
    parentTaskId: parentTask.id,
    childTasks: createdChildTasks,
    totalChildTasks: createdChildTasks.length,
  };
}
