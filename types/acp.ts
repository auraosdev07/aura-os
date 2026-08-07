/**
 * types/acp.ts
 *
 * Single source of truth for Agent Communication Protocol (ACP) v1 types.
 */

export type AgentThreadStatus = "OPEN" | "RESOLVED" | "CLOSED";
export type AgentMessageType = "DIRECT" | "BROADCAST" | "REQUEST_INFO" | "RESPONSE_INFO";
export type AgentMessageStatus = "UNREAD" | "READ" | "RESOLVED";
export type AgentAttachmentType = "DATA" | "ARTIFACT" | "TASK_LINK";

export interface AgentThreadRow {
  id: string;
  subject: string;
  parent_task_id: string | null;
  created_by_agent_id: string;
  status: AgentThreadStatus;
  created_at: string;
  updated_at: string;
}

export interface AgentMessageRow {
  id: string;
  thread_id: string;
  sender_agent_id: string;
  recipient_agent_id: string | null;
  message_type: AgentMessageType;
  content: string;
  status: AgentMessageStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sender?: { id: string; name: string; role: string } | null;
  recipient?: { id: string; name: string; role: string } | null;
  attachments?: AgentMessageAttachmentRow[];
}

export interface AgentMessageAttachmentRow {
  id: string;
  message_id: string;
  title: string;
  attachment_type: AgentAttachmentType;
  content_or_url: string;
  created_at: string;
}

export interface SendMessagePayload {
  sender_agent_id: string;
  recipient_agent_id?: string | null;
  subject: string;
  content: string;
  message_type?: AgentMessageType;
  parent_task_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ReplyMessagePayload {
  sender_agent_id: string;
  thread_id: string;
  content: string;
  recipient_agent_id?: string | null;
  metadata?: Record<string, unknown>;
}
