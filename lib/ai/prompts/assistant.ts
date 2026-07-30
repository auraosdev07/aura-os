/**
 * lib/ai/prompts/assistant.ts
 *
 * Conversational assistant prompt templates.
 */

import { SYSTEM_BASE_PROMPT } from "./system";

export function getAssistantSystemPrompt(context?: { userRole?: string; workspaceName?: string }): string {
  let prompt = `${SYSTEM_BASE_PROMPT}\n\nYou are acting as the primary conversational workspace assistant.`;

  if (context?.userRole) {
    prompt += ` User Role: ${context.userRole}.`;
  }
  if (context?.workspaceName) {
    prompt += ` Workspace: ${context.workspaceName}.`;
  }

  return prompt;
}
