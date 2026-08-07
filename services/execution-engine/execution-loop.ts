/**
 * services/execution-engine/execution-loop.ts
 *
 * Real Tool-Calling & Reasoning Loop (Execution Engine Phase 3.2 Knowledge-Aware)
 * Standardized Execution Pipeline:
 * Task -> Knowledge Retrieval -> Planner Decision -> LLM/Tools -> Structured Result -> Auto-Save to Knowledge -> Completed
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { runTool } from "../tools/tool-runner";
import { createMemory } from "@/services/memory";
import { createTaskOutput } from "@/services/task-output";
import { ProviderManager } from "@/services/providers/provider-manager";
import { autoSaveTaskKnowledge } from "@/services/knowledge-retrieval";
import type { AgentStructuredOutput } from "@/types/task-output";
import type { ExecutionContext } from "./types";
import { generatePlan, type ExecutionStage } from "./planner";

function parseOrFormatStructuredOutput(rawText: string, taskTitle: string): AgentStructuredOutput {
  const trimmed = rawText.trim();

  // 1. Try parsing direct JSON
  try {
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, trimmed];
    const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : trimmed;
    const parsed = JSON.parse(jsonStr);

    if (parsed && typeof parsed === "object" && (parsed.output || parsed.summary)) {
      return {
        summary: parsed.summary || `Executed task: ${taskTitle}`,
        reasoning: parsed.reasoning || "Structured operational reasoning applied.",
        output: parsed.output || parsed.summary || trimmed,
        artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
        next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
      };
    }
  } catch {
    // Non-JSON response, format safely below
  }

  // 2. Safe Fallback formatting for non-JSON LLM responses
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const firstParagraph = lines.slice(0, 3).join(" ");
  const summary =
    firstParagraph.length > 200
      ? firstParagraph.substring(0, 197) + "..."
      : firstParagraph || `Executed task: ${taskTitle}`;

  return {
    summary,
    reasoning: `Synthesized operational deliverables for task '${taskTitle}'.`,
    output: trimmed,
    artifacts: [
      {
        type: "DOCUMENT",
        title: `Deliverable Report - ${taskTitle}`,
        content: trimmed,
      },
    ],
    next_steps: ["Review generated deliverable package", "Verify downstream integration"],
  };
}

export async function executeTaskRun(context: ExecutionContext): Promise<{
  runId: string;
  stagesCompleted: ExecutionStage[];
}> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  // Log Timeline: AGENT_STARTED
  await supabase.from("task_events").insert({
    task_id: context.task.id,
    agent_id: context.agent.id,
    event_type: "AGENT_STARTED",
    message: `Agent '${context.agent.name}' (${context.agent.role}) started execution.`,
    details: { taskId: context.task.id, agentId: context.agent.id },
  });

  // Create initial agent_runs row
  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: context.agent.id,
      status: "RUNNING",
      prompt: context.task.title,
      started_at: now,
    })
    .select("*")
    .single();

  if (runError) throw new Error(`Create Agent Run Error: ${runError.message}`);

  const runId = run.id;
  const stagesCompleted: ExecutionStage[] = [];
  const history: Array<{
    role: "user" | "assistant" | "tool";
    content: string;
    toolCall?: { toolId: string; input: Record<string, unknown> };
    toolResult?: string | Record<string, unknown>;
  }> = [];

  const updateRunStage = async (stage: ExecutionStage, meta: Record<string, unknown> = {}) => {
    stagesCompleted.push(stage);

    await supabase
      .from("agent_runs")
      .update({
        output: {
          stagesCompleted,
          meta,
        },
      })
      .eq("id", runId);

    await supabase.from("task_events").insert({
      task_id: context.task.id,
      agent_id: context.agent.id,
      event_type: `STAGE_${stage.toUpperCase().replace(/\s+/g, "_")}`,
      message: `Execution Engine stage: ${stage}`,
      details: { runId, stage, ...meta },
    });
  };

  // 1. Stage: Planning
  await updateRunStage("Planning");
  const plan = generatePlan(context);

  // 2. Stage: Knowledge Retrieval Event Logging
  await updateRunStage("Knowledge Retrieval", {
    docsCount: context.knowledgeContext?.documents.length || 0,
    highestRelevanceScore: context.knowledgeContext?.highestRelevanceScore || 0,
    hasSufficientKnowledge: context.knowledgeContext?.hasSufficientKnowledge || false,
    retrievalTimeMs: context.knowledgeContext?.retrievalTimeMs || 0,
  });

  if (context.knowledgeContext?.hasSufficientKnowledge) {
    await supabase.from("task_events").insert({
      task_id: context.task.id,
      agent_id: context.agent.id,
      event_type: "KNOWLEDGE_HIT",
      message: `High-confidence knowledge found (Relevance: ${Math.round((context.knowledgeContext.highestRelevanceScore || 0) * 100)}%). Relying on Knowledge Engine.`,
      details: {
        documents: context.knowledgeContext.documents.map((d) => ({ id: d.id, title: d.title, score: d.relevanceScore })),
        highestScore: context.knowledgeContext.highestRelevanceScore,
      },
    });
  } else {
    await supabase.from("task_events").insert({
      task_id: context.task.id,
      agent_id: context.agent.id,
      event_type: "KNOWLEDGE_MISS",
      message: `Knowledge relevance < 65%. Invoking Tool Orchestrator for web search or external retrieval.`,
      details: {
        docsFound: context.knowledgeContext?.documents.length || 0,
        highestScore: context.knowledgeContext?.highestRelevanceScore || 0,
      },
    });
  }

  let rawLlmOutput = "";
  let currentTurnCount = 0;
  const maxTurns = 5;
  let activeProviderName = "GEMINI";

  // 3. Multi-turn Tool-Calling Loop via ProviderManager.generate()
  while (currentTurnCount < maxTurns) {
    currentTurnCount++;

    const { response: providerResponse, activeProvider } = await ProviderManager.generate(
      {
        systemPrompt: plan.prompt.systemPrompt,
        userPrompt: plan.prompt.userPrompt,
        history,
      },
      { taskId: context.task.id, agentId: context.agent.id }
    );

    activeProviderName = activeProvider.toUpperCase();

    if (!providerResponse.success) {
      const errorMsg = providerResponse.error || "LLM Provider execution returned error.";
      await supabase.from("task_events").insert({
        task_id: context.task.id,
        agent_id: context.agent.id,
        event_type: "TASK_EXECUTION_FAILED",
        message: `Task execution failed: ${errorMsg}`,
        details: { error: errorMsg, provider: activeProviderName },
      });

      await supabase
        .from("agent_runs")
        .update({
          status: "FAILED",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);

      await supabase
        .from("tasks")
        .update({
          status: "FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", context.task.id);

      throw new Error(`Execution Failed: ${errorMsg}`);
    }

    // If Provider requests a Tool Call
    if (providerResponse.responseType === "CALL_TOOL" && providerResponse.toolCall) {
      const { toolId, input } = providerResponse.toolCall;

      await updateRunStage("Tool Calling", { toolId, input, turn: currentTurnCount });

      // Log Timeline: TOOL_CALLED
      await supabase.from("task_events").insert({
        task_id: context.task.id,
        agent_id: context.agent.id,
        event_type: "TOOL_CALLED",
        message: `Tool '${toolId}' called by agent '${context.agent.name}'.`,
        details: { toolId, input, turn: currentTurnCount },
      });

      // Execute Tool via Tool Runner
      const toolResult = await runTool(toolId, input, context.agent.id, context.task.id);

      // Log Timeline: TOOL_FINISHED
      await supabase.from("task_events").insert({
        task_id: context.task.id,
        agent_id: context.agent.id,
        event_type: "TOOL_FINISHED",
        message: `Tool '${toolId}' completed (${toolResult.executionTimeMs}ms). Success: ${toolResult.success}`,
        details: { toolId, success: toolResult.success, executionTimeMs: toolResult.executionTimeMs },
      });

      // Record Turn into History
      history.push({
        role: "assistant",
        content: providerResponse.output,
        toolCall: providerResponse.toolCall,
      });

      history.push({
        role: "tool",
        content: toolResult.success ? "Tool executed successfully" : "Tool execution error",
        toolResult: toolResult.output,
      });

      // Continue loop to feed toolResult back to provider
      continue;
    }

    // Provider returns Final Response
    if (providerResponse.responseType === "FINAL_RESPONSE") {
      rawLlmOutput = providerResponse.output;

      // Stage: Reasoning
      await updateRunStage("Reasoning", { turnsCount: currentTurnCount });

      // Stage: Writing
      await updateRunStage("Writing", { outputLength: rawLlmOutput.length });
      break;
    }
  }

  // STRICT NON-FAKE COMPLETION VALIDATION
  if (!rawLlmOutput || rawLlmOutput.trim().length === 0) {
    const errorMsg = "LLM execution failed or returned empty output.";
    await supabase.from("task_events").insert({
      task_id: context.task.id,
      agent_id: context.agent.id,
      event_type: "TASK_EXECUTION_FAILED",
      message: `Task execution failed: ${errorMsg}`,
      details: { error: errorMsg },
    });

    await supabase
      .from("agent_runs")
      .update({
        status: "FAILED",
        error_message: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await supabase
      .from("tasks")
      .update({
        status: "FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.task.id);

    throw new Error(`Execution Failed: ${errorMsg}`);
  }

  // Parse or format standardized AgentStructuredOutput
  const structuredOutput = parseOrFormatStructuredOutput(rawLlmOutput, context.task.title);

  // Store in task_outputs & task_artifacts
  await createTaskOutput(context.task.id, context.agent.id, structuredOutput);

  // Log Timeline: OUTPUT_GENERATED
  await supabase.from("task_events").insert({
    task_id: context.task.id,
    agent_id: context.agent.id,
    event_type: "OUTPUT_GENERATED",
    message: `Generated deliverable output (${structuredOutput.artifacts.length} artifacts created).`,
    details: { summary: structuredOutput.summary, artifactsCount: structuredOutput.artifacts.length },
  });

  // Stage: Memory (Auto-save insight into agent_memory)
  await updateRunStage("Memory");
  try {
    const memoryKey = `last_task_insight_${context.task.id.substring(0, 8)}`;
    await createMemory(
      context.agent.id,
      memoryKey,
      {
        taskTitle: context.task.title,
        executedBy: context.agent.name,
        completedAt: new Date().toISOString(),
        summary: structuredOutput.summary,
      },
      "private"
    );
  } catch (memErr) {
    console.error("[AUTO MEMORY SAVE ERROR]:", memErr);
  }

  // AUTOMATIC LEARNING: Auto-save task deliverable inside Knowledge Engine
  try {
    await autoSaveTaskKnowledge({
      taskId: context.task.id,
      taskTitle: context.task.title,
      agentRole: context.agent.role,
      summary: structuredOutput.summary,
      output: structuredOutput.output,
    });

    await supabase.from("task_events").insert({
      task_id: context.task.id,
      agent_id: context.agent.id,
      event_type: "KNOWLEDGE_AUTO_SAVED",
      message: `Task deliverable automatically stored in Knowledge Engine for future agent reuse.`,
      details: { taskId: context.task.id, title: context.task.title },
    });
  } catch (kErr) {
    console.error("[KNOWLEDGE AUTO SAVE ERROR]:", kErr);
  }

  // Stage: Completed & Final Task Completion Transaction
  await updateRunStage("Completed");

  // Save Consolidated Deliverable Artifact
  await supabase.from("task_artifacts").insert({
    task_id: context.task.id,
    title: `Execution Output - ${context.task.title}`,
    artifact_type: "document",
    content_or_url: structuredOutput.output,
    metadata: {
      generatedAt: now,
      runId,
      agentId: context.agent.id,
      provider: activeProviderName,
      totalTurns: currentTurnCount,
      stagesCompleted,
    },
  });

  // Complete agent_runs
  await supabase
    .from("agent_runs")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      output: {
        systemPrompt: plan.prompt.systemPrompt,
        userPrompt: plan.prompt.userPrompt,
        summary: structuredOutput.summary,
        output: structuredOutput.output,
        stagesCompleted,
        totalTurns: currentTurnCount,
      },
    })
    .eq("id", runId);

  // Complete Task
  console.log(`Completed child ${context.task.id}`);
  try {
    const { completeTask } = await import("@/services/task");
    await completeTask(context.task.id, {
      runId,
      agentId: context.agent.id,
      finalOutputPreview: structuredOutput.summary.substring(0, 100),
      totalTurns: currentTurnCount,
    });
  } catch (completeErr: unknown) {
    const errorMsg =
      completeErr instanceof Error ? completeErr.message : "Supabase task update failed";

    await supabase.from("task_events").insert({
      task_id: context.task.id,
      agent_id: context.agent.id,
      event_type: "TASK_COMPLETION_FAILED",
      message: `Task completion database update failed: ${errorMsg}`,
      details: { error: errorMsg },
    });

    throw new Error(`Execution Loop Task Completion Failed: ${errorMsg}`);
  }

  return {
    runId,
    stagesCompleted,
  };
}

export async function executeMultiStepLoop(params: {
  context: ExecutionContext;
  runId?: string;
}): Promise<{ runId: string; stagesCompleted: ExecutionStage[] }> {
  return executeTaskRun(params.context);
}
