/**
 * lib/ai/prompts/mission.ts
 *
 * Mission-related prompt templates (stub for future extension).
 */

import { SYSTEM_BASE_PROMPT } from "./system";

export function getMissionSystemPrompt(missionTitle?: string): string {
  let prompt = `${SYSTEM_BASE_PROMPT}\n\nYou are an AI assistant specialized in mission management and goal tracking.`;
  if (missionTitle) {
    prompt += ` Current Mission: ${missionTitle}.`;
  }
  return prompt;
}
