/**
 * services/seo/seo-task-generator.ts
 *
 * Automatic Task Generation Module (Phase 4B.1).
 * Automatically generates tasks ONLY for HIGH severity SEO issues.
 * Prevents duplicate task creation by verifying active tasks for matching ruleId + URL.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { SEOIssue } from "./types";

export async function generateTasksFromSEOAudit(
  jobId: string,
  targetUrl: string,
  issues: SEOIssue[]
): Promise<number> {
  const highIssues = issues.filter((i) => i.severity === "HIGH");
  if (highIssues.length === 0) return 0;

  const { supabase } = await getServerContext();
  let createdCount = 0;

  // 1. Fetch active tasks to prevent duplicate creation
  const { data: activeTasks } = await supabase
    .from("tasks")
    .select("title")
    .in("status", ["PENDING", "ASSIGNED", "IN_PROGRESS"]);

  const activeTitles = new Set((activeTasks || []).map((t) => t.title));

  for (const issue of highIssues) {
    const taskTitle = `[SEO FIX] ${issue.ruleId}: ${issue.affectedUrl}`;

    // Duplicate Check
    if (activeTitles.has(taskTitle)) {
      console.log(`[SEO TASK GENERATOR] Skipped duplicate active task: ${taskTitle}`);
      continue;
    }

    const taskDescription = `High-severity SEO issue detected on ${issue.affectedUrl}.\n\nIssue: ${issue.issue}\nExplanation: ${issue.explanation}\nRecommendation: ${issue.recommendation}\nCrawl Job ID: ${jobId}`;

    const { error } = await supabase.from("tasks").insert({
      title: taskTitle,
      description: taskDescription,
      status: "ASSIGNED",
      priority: "HIGH",
      metadata: {
        ruleId: issue.ruleId,
        category: issue.category,
        affectedUrl: issue.affectedUrl,
        assignedRole: "seo-specialist-agent",
        jobId,
      },
    });

    if (!error) {
      activeTitles.add(taskTitle);
      createdCount++;
    } else {
      console.error(`[SEO TASK GENERATION ERROR] ${taskTitle}:`, error.message);
    }
  }

  return createdCount;
}
