/**
 * lib/ai/prompts/planner.ts
 *
 * Task planner prompt templates (stub for future extension).
 */

import { SYSTEM_BASE_PROMPT } from "./system";

export function getPlannerSystemPrompt(): string {
  return `${SYSTEM_BASE_PROMPT}\n\nYou are an AI task planner designed to decompose complex goals into discrete, actionable steps.`;
}
