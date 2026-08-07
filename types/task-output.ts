/**
 * types/task-output.ts
 *
 * Single source of truth for Standardized Task Execution Outputs & Artifacts in Aura OS.
 */

export interface AgentArtifactItem {
  type: string; // e.g., "DOCUMENT" | "DATA" | "CODE" | "MARKDOWN" | "REPORT" | "KEYWORDS" | "STRATEGY"
  title: string;
  content: string;
}

export interface AgentStructuredOutput {
  summary: string;
  reasoning: string;
  output: string;
  artifacts: AgentArtifactItem[];
  next_steps?: string[];
}

export interface TaskOutputRow {
  id: string;
  task_id: string;
  agent_id: string | null;
  summary: string;
  reasoning: string | null;
  output: string;
  json_output: AgentStructuredOutput | Record<string, unknown>;
  created_at: string;
  agent?: { id: string; name: string; role: string } | null;
}
