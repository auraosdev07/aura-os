"use server";

/**
 * services/conversation.ts
 *
 * Server Actions & business logic for conversation persistence, auto-titling,
 * message history tracking, and summary rollups.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerContext } from "@/lib/auth/get-server-context";
import {
  getConversation,
  getConversationMessages,
  getConversationSummary,
} from "@/lib/db/queries";
import {
  createConversation as createConvMutation,
  appendConversationMessage as appendMsgMutation,
  storeConversationSummary as storeSummaryMutation,
} from "@/lib/db/mutations";
import { generateText } from "@/lib/ai/client";
import { embedTexts } from "@/lib/rag/embedder";
import type { ConversationRow, ConversationMessageRow } from "@/types/database";

const SUMMARY_THRESHOLD_MESSAGES = 6;

async function getContext(clientOverride?: SupabaseClient, userIdOverride?: string) {
  if (clientOverride) {
    return { supabase: clientOverride, user: { id: userIdOverride || "dev-owner-id" } };
  }
  const ctx = await getServerContext();
  return {
    supabase: ctx.supabase,
    user: ctx.user,
  };
}

/**
 * Create a new conversation thread for the active user.
 */
export async function createConversation(
  title = "New Conversation",
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ConversationRow> {
  const { supabase, user } = await getContext(clientOverride, userIdOverride);
  return createConvMutation(supabase, {
    owner_id: user.id,
    title,
  });
}

/**
 * Get an existing conversation or create a new one if ID is missing/invalid.
 */
export async function getOrCreateConversation(
  conversationId?: string,
  title = "New Conversation",
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ConversationRow> {
  const { supabase, user } = await getContext(clientOverride, userIdOverride);

  if (conversationId && !conversationId.startsWith("conv-initial")) {
    try {
      const existing = await getConversation(supabase, conversationId, user.id);
      if (existing) return existing;
    } catch {
      // Fall through to create new conversation if non-existent
    }
  }

  return createConvMutation(supabase, {
    owner_id: user.id,
    title,
  });
}

/**
 * Append a user message to a conversation thread.
 */
export async function appendUserMessage(
  conversationId: string,
  content: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ConversationMessageRow> {
  const { supabase } = await getContext(clientOverride, userIdOverride);
  return appendMsgMutation(supabase, {
    conversation_id: conversationId,
    role: "user",
    content: content.trim(),
  });
}

/**
 * Append an assistant message to a conversation thread.
 * Auto-generates title on turn 1 and checks if summary rollup is needed.
 */
export async function appendAssistantMessage(
  conversationId: string,
  content: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ConversationMessageRow> {
  const { supabase, user } = await getContext(clientOverride, userIdOverride);

  const msg = await appendMsgMutation(supabase, {
    conversation_id: conversationId,
    role: "assistant",
    content: content.trim(),
  });

  // Check if title generation is required
  const conv = await getConversation(supabase, conversationId, user.id);
  if (conv && (conv.title === "New Conversation" || conv.title === "New Chat" || !conv.title)) {
    const messages = await getConversationMessages(supabase, conversationId);
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const newTitle = await generateConversationTitle(firstUserMsg.content);
      await updateConversationTitle(conversationId, newTitle, supabase, user.id);
    }
  }

  // Check if conversation summary rollup is required
  const allMessages = await getConversationMessages(supabase, conversationId);
  if (allMessages.length >= SUMMARY_THRESHOLD_MESSAGES) {
    const existingSummary = await getConversationSummary(supabase, conversationId);
    if (!existingSummary) {
      const summaryText = await summarizeThreadMessages(allMessages);
      await storeConversationSummary(conversationId, summaryText, supabase);
    }
  }

  return msg;
}

/**
 * Update the title of a conversation.
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<void> {
  const { supabase, user } = await getContext(clientOverride, userIdOverride);
  await supabase
    .from("conversations")
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("owner_id", user.id);
}

/**
 * Generate a concise title (max 6 words) based on the first user message.
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return "New Conversation";
  }

  try {
    const res = await generateText({
      messages: [
        { role: "system", content: "You are a title generator. Respond only with the title." },
        { role: "user", content: `Generate a short title (maximum 6 words, plain text only, no quotes) summarizing this query:\n"${firstMessage.substring(0, 300)}"` },
      ],
      temperature: 0.3,
    });
    const cleaned = res.text.replace(/^["']|["']$/g, "").trim();
    return cleaned.split(/\s+/).slice(0, 6).join(" ") || "New Conversation";
  } catch {
    const fallback = firstMessage.trim().split(/\s+/).slice(0, 5).join(" ");
    return fallback ? `${fallback}...` : "New Conversation";
  }
}

/**
 * Store a thread summary rollup with 768-dim vector embedding.
 */
export async function storeConversationSummary(
  conversationId: string,
  summaryText: string,
  clientOverride?: SupabaseClient
): Promise<void> {
  const { supabase } = await getContext(clientOverride);

  let embedding = new Array(768).fill(0);
  try {
    const res = await embedTexts([summaryText]);
    if (res.embeddings && res.embeddings.length > 0) {
      embedding = res.embeddings[0];
    }
  } catch {
    // Fallback zero vector
  }

  await storeSummaryMutation(supabase, {
    conversation_id: conversationId,
    summary_text: summaryText,
    embedding,
  });

  // Update high-level summary on conversations table
  await supabase
    .from("conversations")
    .update({ summary: summaryText, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

/**
 * Helper to summarize thread messages using LLM.
 */
async function summarizeThreadMessages(messages: ConversationMessageRow[]): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content.substring(0, 300)}`)
    .join("\n");

  try {
    const res = await generateText({
      messages: [
        { role: "system", content: "You are a conversation summarizer. Output a concise summary." },
        { role: "user", content: `Summarize the core topics and decisions in this conversation transcript in 2-3 concise sentences:\n\n${transcript}` },
      ],
      temperature: 0.3,
    });
    return res.text.trim();
  } catch {
    return "Conversation thread covering operations and operational directives.";
  }
}
