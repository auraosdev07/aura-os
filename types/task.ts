/**
 * types/task.ts
 *
 * Single source of truth for Task Orchestrator Foundation types & interfaces.
 * Strictly typed with zero 'any'.
 */

import type { AgentRow } from "./agent";

export type TaskStatus =
  | "CREATED"
  | "QUEUED"
  | "ASSIGNED"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface TaskRow {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_agent_id: string | null;
  requested_by: string;
  due_date: string | null;
  progress: number;
  estimated_duration: string | null;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  assigned_agent?: AgentRow | null;
}

export interface TaskAssignmentRow {
  id: string;
  task_id: string;
  agent_id: string;
  role: string;
  assigned_at: string;
  agent?: AgentRow | null;
}

export interface TaskEventRow {
  id: string;
  task_id: string;
  agent_id: string | null;
  event_type: string;
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
  agent?: AgentRow | null;
}

export interface TaskArtifactRow {
  id: string;
  task_id: string;
  title: string;
  artifact_type: string;
  content_or_url: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface FullTaskDetails {
  task: TaskRow;
  assignedAgent: AgentRow | null;
  assignments: TaskAssignmentRow[];
  events: TaskEventRow[];
  artifacts: TaskArtifactRow[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_agent_id?: string | null;
  due_date?: string | null;
  estimated_duration?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_agent_id?: string | null;
  progress?: number;
  due_date?: string | null;
  estimated_duration?: string | null;
  metadata?: Record<string, unknown>;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  agentId?: string;
  search?: string;
}
