"use server";

/**
 * services/multi-agent/planner.ts
 *
 * Multi-Agent Collaboration Planner
 * Decomposes a parent task into a structured DAG of ordered subtasks
 * with explicit dependencies and target agent role hints.
 * Fully deterministic (no LLM required).
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { createTask } from "@/services/task";
import type { TaskRow, TaskPriority, TaskStatus } from "@/types/task";

export interface SubtaskPlanDefinition {
  titleSuffix: string;
  description: string;
  targetRole: string;
  executionOrder: number;
  dependsOnIndex: number | null; // index of prerequisite subtask in plan
}

export async function generateSubtaskDefinitions(parentTitle: string): Promise<SubtaskPlanDefinition[]> {
  return [
    {
      titleSuffix: "SEO Research & Keyword Mapping",
      description: `Perform keyword research and SEO strategy for campaign: '${parentTitle}'.`,
      targetRole: "SEO",
      executionOrder: 1,
      dependsOnIndex: null,
    },
    {
      titleSuffix: "Content Writing & Copywriting",
      description: `Draft engaging marketing copy based on SEO research for '${parentTitle}'.`,
      targetRole: "Marketing",
      executionOrder: 2,
      dependsOnIndex: 0, // Depends on SEO Research
    },
    {
      titleSuffix: "Product Images & Visual Assets",
      description: `Design high-resolution visual assets and banners for '${parentTitle}'.`,
      targetRole: "Designer",
      executionOrder: 2,
      dependsOnIndex: 0, // Depends on SEO Research
    },
    {
      titleSuffix: "Product Page Implementation",
      description: `Build or update the product page layout and database entry for '${parentTitle}'.`,
      targetRole: "Developer",
      executionOrder: 3,
      dependsOnIndex: 1, // Depends on Content Writing
    },
    {
      titleSuffix: "Marketing Campaign Assets",
      description: `Prepare email sequences and social media campaign assets for '${parentTitle}'.`,
      targetRole: "Marketing",
      executionOrder: 4,
      dependsOnIndex: 3, // Depends on Product Page
    },
    {
      titleSuffix: "QA & Compliance Review",
      description: `Final quality assurance, link validation, and content review for '${parentTitle}'.`,
      targetRole: "Developer",
      executionOrder: 5,
      dependsOnIndex: 4, // Depends on Marketing Campaign
    },
  ];
}

export interface PlanDecompositionResult {
  parentTaskId: string;
  childTasks: TaskRow[];
  subtaskRecordsCount: number;
}

export async function decomposeTaskIntoSubtasks(
  parentTask: TaskRow
): Promise<PlanDecompositionResult> {
  const { supabase } = await getServerContext();

  const definitions = await generateSubtaskDefinitions(parentTask.title);
  const createdChildTasks: TaskRow[] = [];
  const createdTaskIds: string[] = [];

  for (let i = 0; i < definitions.length; i++) {
    const def = definitions[i];
    const hasDependency = def.dependsOnIndex !== null && def.dependsOnIndex < i;
    const dependencyTaskId = hasDependency ? createdTaskIds[def.dependsOnIndex!] : null;

    // Initial status: CREATED if no dependency, WAITING if waiting on dependency
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
      message: `Subtask created: ${childTask.title}`,
      details: {
        childTaskId: childTask.id,
        targetRole: def.targetRole,
        executionOrder: def.executionOrder,
        dependencyTaskId,
      },
    });
  }

  // Update parent task to WAITING if subtasks created
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
    subtaskRecordsCount: createdChildTasks.length,
  };
}
