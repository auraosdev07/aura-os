/**
 * lib/ai/prompts/knowledge.ts
 *
 * Knowledge-related prompt templates (stub for future extension).
 */

import { SYSTEM_BASE_PROMPT } from "./system";

export function getKnowledgeSystemPrompt(): string {
  return `${SYSTEM_BASE_PROMPT}\n\nYou are an AI assistant specialized in organizational knowledge processing, summarization, and structure.`;
}
