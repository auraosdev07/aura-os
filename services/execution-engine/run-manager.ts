/**
 * services/execution-engine/run-manager.ts
 *
 * Run Manager Module
 * Manages agent_runs record lifecycle (QUEUED -> RUNNING -> WAITING_FOR_MODEL -> COMPLETED),
 * invokes the AI Provider Layer, saves mock outputs, and inserts execution artifacts.
 * Provider selection is transparent — the engine never knows which provider runs.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { resolveProvider } from "@/services/providers/provider-factory";
import { getProviderConfig } from "@/services/providers/config-manager";
import type { GeneratedPrompt } from "./types";

export interface CreateRunParams {
  agentId: string;
  taskId: string;
  taskTitle: string;
  prompt: GeneratedPrompt;
}

export async function createAndTransitionRun(params: CreateRunParams): Promise<string> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  // 1. Insert initial agent_runs record with status 'QUEUED'
  const { data: run, error: runErr } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: params.agentId,
      prompt: params.prompt.userPrompt,
      status: "QUEUED",
      started_at: now,
      output: {
        systemPrompt: params.prompt.systemPrompt,
        userPrompt: params.prompt.userPrompt,
        metadata: params.prompt.metadata,
      },
    })
    .select("id")
    .single();

  if (runErr || !run) {
    throw new Error(`Failed to create agent_run record: ${runErr?.message}`);
  }

  const runId = run.id;

  // 2. Transition: QUEUED -> RUNNING
  await supabase.from("agent_runs").update({ status: "RUNNING" }).eq("id", runId);

  // Log Event 1: Execution Started
  await supabase.from("task_events").insert({
    task_id: params.taskId,
    agent_id: params.agentId,
    event_type: "EXECUTION_STARTED",
    message: "Execution Started",
    details: { run_id: runId, started_at: now },
  });

  // Log Event 2: Prompt Generated
  await supabase.from("task_events").insert({
    task_id: params.taskId,
    agent_id: params.agentId,
    event_type: "PROMPT_GENERATED",
    message: "Prompt Generated",
    details: { run_id: runId, metadata: params.prompt.metadata },
  });

  // 3. Transition: RUNNING -> WAITING_FOR_MODEL
  await supabase.from("agent_runs").update({ status: "WAITING_FOR_MODEL" }).eq("id", runId);

  // Log Event 3: Waiting for AI Provider
  await supabase.from("task_events").insert({
    task_id: params.taskId,
    agent_id: params.agentId,
    event_type: "WAITING_FOR_MODEL",
    message: "Waiting for AI Provider",
    details: { run_id: runId, status: "WAITING_FOR_MODEL" },
  });

  // 4. Resolve provider (fully transparent — engine doesn't know which one)
  const config = getProviderConfig();
  const provider = resolveProvider(config.provider);

  const providerResponse = await provider.executePrompt(
    {
      systemPrompt: params.prompt.systemPrompt,
      userPrompt: params.prompt.userPrompt,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    },
    config
  );

  // 5. Save provider response into agent_runs.output (completed)
  await supabase
    .from("agent_runs")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      output: {
        systemPrompt: params.prompt.systemPrompt,
        userPrompt: params.prompt.userPrompt,
        metadata: params.prompt.metadata,
        providerResponse,
      },
    })
    .eq("id", runId);

  // 6. Log Event 4: AI Provider Response Received
  await supabase.from("task_events").insert({
    task_id: params.taskId,
    agent_id: params.agentId,
    event_type: "AI_RESPONSE_RECEIVED",
    message: `AI Provider Response Received (${provider.getProviderName()})`,
    details: {
      run_id: runId,
      provider: provider.getProviderName(),
      model: providerResponse.model,
      success: providerResponse.success,
      usage: providerResponse.usage,
    },
  });

  // 7. Save output artifact if provider response succeeded with real output
  if (providerResponse.success && providerResponse.output) {
    await supabase.from("task_artifacts").insert({
      task_id: params.taskId,
      title: "Execution Deliverable Preview",
      artifact_type: "preview",
      content_or_url: providerResponse.output,
      metadata: {
        generatedAt: now,
        runId,
        agentId: params.agentId,
        provider: provider.getProviderName(),
        model: providerResponse.model,
        usage: providerResponse.usage,
      },
    });
  }

  return runId;
}
