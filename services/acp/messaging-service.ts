"use server";

/**
 * services/acp/messaging-service.ts
 *
 * Agent Communication Protocol (ACP) v1 Messaging Service
 * Manages inter-agent direct messaging, broadcasts, thread replies,
 * inbox/outbox fetching, unread counts, and message status updates.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type {
  AgentThreadRow,
  AgentMessageRow,
  SendMessagePayload,
  ReplyMessagePayload,
} from "@/types/acp";

export async function sendDirectMessage(payload: SendMessagePayload): Promise<AgentMessageRow> {
  const { supabase } = await getServerContext();

  // 1. Create a new thread
  const { data: thread, error: threadErr } = await supabase
    .from("agent_threads")
    .insert({
      subject: payload.subject,
      parent_task_id: payload.parent_task_id || null,
      created_by_agent_id: payload.sender_agent_id,
      status: "OPEN",
    })
    .select("*")
    .single();

  if (threadErr) {
    console.error("[ACP] Thread creation error:", threadErr);
    throw new Error(`Send Direct Message Thread Error: ${threadErr.message}`);
  }

  // 2. Insert direct message into agent_messages
  const { data: msg, error: msgErr } = await supabase
    .from("agent_messages")
    .insert({
      thread_id: thread.id,
      sender_agent_id: payload.sender_agent_id,
      recipient_agent_id: payload.recipient_agent_id || null,
      message_type: payload.message_type || "DIRECT",
      content: payload.content,
      status: "UNREAD",
      metadata: payload.metadata || {},
    })
    .select("*")
    .single();

  if (msgErr) {
    console.error("[ACP] Message insertion error:", msgErr);
    throw new Error(`Send Direct Message Error: ${msgErr.message}`);
  }

  return msg as AgentMessageRow;
}

export async function sendBroadcastMessage(
  payload: Omit<SendMessagePayload, "recipient_agent_id">
): Promise<AgentMessageRow> {
  return sendDirectMessage({
    ...payload,
    recipient_agent_id: null,
    message_type: "BROADCAST",
  });
}

export async function replyToMessage(payload: ReplyMessagePayload): Promise<AgentMessageRow> {
  const { supabase } = await getServerContext();

  const { data: msg, error: msgErr } = await supabase
    .from("agent_messages")
    .insert({
      thread_id: payload.thread_id,
      sender_agent_id: payload.sender_agent_id,
      recipient_agent_id: payload.recipient_agent_id || null,
      message_type: "DIRECT",
      content: payload.content,
      status: "UNREAD",
      metadata: payload.metadata || {},
    })
    .select("*")
    .single();

  if (msgErr) throw new Error(`Reply Message Error: ${msgErr.message}`);

  // Update thread updated_at
  await supabase
    .from("agent_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", payload.thread_id);

  return msg as AgentMessageRow;
}

export async function getInbox(agentId: string): Promise<AgentMessageRow[]> {
  const { supabase } = await getServerContext();

  const { data: messages, error } = await supabase
    .from("agent_messages")
    .select(`
      *,
      sender:agents!agent_messages_sender_agent_id_fkey(id, name, role),
      recipient:agents!agent_messages_recipient_agent_id_fkey(id, name, role),
      attachments:agent_message_attachments(*)
    `)
    .or(`recipient_agent_id.eq.${agentId},message_type.eq.BROADCAST`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ACP GET INBOX ERROR]:", error);
    return [];
  }

  return (messages as AgentMessageRow[]) || [];
}

export async function getOutbox(agentId: string): Promise<AgentMessageRow[]> {
  const { supabase } = await getServerContext();

  const { data: messages, error } = await supabase
    .from("agent_messages")
    .select(`
      *,
      sender:agents!agent_messages_sender_agent_id_fkey(id, name, role),
      recipient:agents!agent_messages_recipient_agent_id_fkey(id, name, role),
      attachments:agent_message_attachments(*)
    `)
    .eq("sender_agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ACP GET OUTBOX ERROR]:", error);
    return [];
  }

  return (messages as AgentMessageRow[]) || [];
}

export async function getThreadMessages(threadId: string): Promise<{
  thread: AgentThreadRow | null;
  messages: AgentMessageRow[];
}> {
  const { supabase } = await getServerContext();

  const [threadRes, msgsRes] = await Promise.all([
    supabase.from("agent_threads").select("*").eq("id", threadId).single(),
    supabase
      .from("agent_messages")
      .select(`
        *,
        sender:agents!agent_messages_sender_agent_id_fkey(id, name, role),
        recipient:agents!agent_messages_recipient_agent_id_fkey(id, name, role),
        attachments:agent_message_attachments(*)
      `)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    thread: (threadRes.data as AgentThreadRow) || null,
    messages: (msgsRes.data as AgentMessageRow[]) || [],
  };
}

export async function getUnreadCount(agentId: string): Promise<number> {
  const { supabase } = await getServerContext();

  const { count, error } = await supabase
    .from("agent_messages")
    .select("id", { count: "exact", head: true })
    .or(`recipient_agent_id.eq.${agentId},message_type.eq.BROADCAST`)
    .eq("status", "UNREAD");

  if (error) {
    console.error("[ACP UNREAD COUNT ERROR]:", error);
    return 0;
  }

  return count || 0;
}

export async function markMessageRead(messageId: string): Promise<boolean> {
  const { supabase } = await getServerContext();

  const { error } = await supabase
    .from("agent_messages")
    .update({ status: "READ", updated_at: new Date().toISOString() })
    .eq("id", messageId);

  return !error;
}

export async function resolveThread(threadId: string): Promise<boolean> {
  const { supabase } = await getServerContext();

  const { error } = await supabase
    .from("agent_threads")
    .update({ status: "RESOLVED", updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (!error) {
    await supabase
      .from("agent_messages")
      .update({ status: "RESOLVED" })
      .eq("thread_id", threadId);
  }

  return !error;
}
