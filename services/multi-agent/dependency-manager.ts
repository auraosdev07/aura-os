"use server";

/**
 * services/multi-agent/dependency-manager.ts
 *
 * Multi-Agent Dependency Manager & Parent Progress Synchronizer
 * Monitors subtask completions, unlocks waiting dependent child subtasks,
 * updates parent progress percentage, and marks parent task COMPLETED when all subtasks finish.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { mergeSubtaskResultsIntoParent } from "./merge-results";
import type { TaskRow } from "@/types/task";

export interface DependencyCheckResult {
  parentTaskId: string;
  totalSubtasks: number;
  completedSubtasks: number;
  unlockedChildTaskIds: string[];
  parentCompleted: boolean;
  progressPercentage: number;
}

export async function checkAndUnlockNextSubtasks(
  completedChildTaskId: string
): Promise<DependencyCheckResult | null> {
  const { supabase } = await getServerContext();

  // 1. Find parent task link for this completed child task
  const { data: subtaskLink } = await supabase
    .from("task_subtasks")
    .select("parent_task_id")
    .eq("child_task_id", completedChildTaskId)
    .maybeSingle();

  if (!subtaskLink) return null;

  const parentTaskId = subtaskLink.parent_task_id;
  console.log(`[MACE] Dependency Manager Callback Fired: Child ${completedChildTaskId} completed (Parent: ${parentTaskId}).`);

  // Log SUBTASK_COMPLETED event on parent task
  await supabase.from("task_events").insert({
    task_id: parentTaskId,
    event_type: "SUBTASK_COMPLETED",
    message: `Subtask #${completedChildTaskId.substring(0, 8)} completed.`,
    details: { childTaskId: completedChildTaskId },
  });

  // 2. Fetch all subtask links for this parent task
  const { data: allSubtaskLinks } = await supabase
    .from("task_subtasks")
    .select("child_task_id, dependency_task_id")
    .eq("parent_task_id", parentTaskId);

  if (!allSubtaskLinks || allSubtaskLinks.length === 0) return null;

  const allChildIds = allSubtaskLinks.map((s) => s.child_task_id);

  // Fetch full task rows of all child tasks
  const { data: allChildTasks } = await supabase
    .from("tasks")
    .select("*")
    .in("id", allChildIds);

  if (!allChildTasks) return null;

  const totalSubtasks = allChildTasks.length;

  // Ensure completedChildTaskId is counted as completed
  const completedSubtasks = allChildTasks.filter(
    (t) => t.id === completedChildTaskId || t.status === "COMPLETED"
  ).length;

  const progressPercentage = Math.round((completedSubtasks / totalSubtasks) * 100);
  console.log(`Parent: ${parentTaskId}\nCompleted children: ${completedSubtasks}\nTotal children: ${totalSubtasks}`);

  // 3. Unlock waiting dependent child tasks whose prerequisite is completed
  const unlockedChildTaskIds: string[] = [];

  for (const link of allSubtaskLinks) {
    if (link.dependency_task_id === completedChildTaskId) {
      const targetChild = allChildTasks.find((t) => t.id === link.child_task_id);
      if (targetChild && targetChild.status === "WAITING") {
        await supabase
          .from("tasks")
          .update({
            status: "CREATED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetChild.id);

        console.log(`Unlocked child ${targetChild.id}`);
        unlockedChildTaskIds.push(targetChild.id);
      }
    }
  }

  // 4. Update Parent Task Progress in DB
  const nowStr = new Date().toISOString();
  await supabase
    .from("tasks")
    .update({
      progress: progressPercentage,
      updated_at: nowStr,
    })
    .eq("id", parentTaskId);

  // Log PARENT_PROGRESS_UPDATED event
  await supabase.from("task_events").insert({
    task_id: parentTaskId,
    event_type: "PARENT_PROGRESS_UPDATED",
    message: `Parent task progress updated to ${progressPercentage}% (${completedSubtasks}/${totalSubtasks} subtasks completed).`,
    details: { progressPercentage, completedSubtasks, totalSubtasks },
  });

  // 5. If every child task is completed, execute MACE Merge Engine and mark parent task COMPLETED!
  let parentCompleted = false;
  if (completedSubtasks === totalSubtasks) {
    // A. Invoke MACE Merge Engine to populate merged_outputs table & parent task artifact
    try {
      const { mergeMaceChildOutputs } = await import("@/services/mace/mace-merger");
      await mergeMaceChildOutputs(parentTaskId, allChildTasks as TaskRow[]);
    } catch (maceMergeErr) {
      console.error(`[MACE] Merge Engine Error for Parent ${parentTaskId}:`, maceMergeErr);
    }

    // B. Merge subtask results into consolidated parent deliverable report
    try {
      await mergeSubtaskResultsIntoParent(parentTaskId, allChildTasks as TaskRow[]);
    } catch (subtaskMergeErr) {
      console.error("[SUBTASK MERGE RESULTS ERROR]:", subtaskMergeErr);
    }

    // C. Update parent task in database to COMPLETED with 100% progress
    const { error: parentUpdateErr } = await supabase
      .from("tasks")
      .update({
        status: "COMPLETED",
        progress: 100,
        completed_at: nowStr,
        updated_at: nowStr,
      })
      .eq("id", parentTaskId);

    if (parentUpdateErr) {
      console.error("Parent update FAILED");
    } else {
      console.log("Parent updated to COMPLETED");
    }

    parentCompleted = true;

    // D. Log PARENT_COMPLETED event
    await supabase.from("task_events").insert({
      task_id: parentTaskId,
      event_type: "PARENT_COMPLETED",
      message: `All ${totalSubtasks} subtasks completed! Parent task automatically marked COMPLETED.`,
      details: { totalSubtasks, progressPercentage: 100, status: "COMPLETED", completed_at: nowStr },
    });
  }

  return {
    parentTaskId,
    totalSubtasks,
    completedSubtasks,
    unlockedChildTaskIds,
    parentCompleted,
    progressPercentage,
  };
}
