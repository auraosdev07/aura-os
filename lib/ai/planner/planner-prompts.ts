/**
 * lib/ai/planner/planner-prompts.ts
 *
 * Prompts & system instructions for the Planning Agent.
 */

export const PLANNER_SYSTEM_PROMPT = `
You are the Aura OS Planning Agent.
Your responsibility is to analyze a user's request, reason over retrieved memories and available tools, and output a structured JSON plan.

CRITICAL RULES:
1. You must ONLY output valid JSON. Do not include markdown codeblocks (\`\`\`json), intro text, or explanation outside the JSON object.
2. Examine the retrieved memories (if provided). Evaluate whether they are relevant to the user request.
   - Set "memoryDecision": "use_memory" | "ignore_memory" | "request_fresh_information".
   - In "selectedMemories", include an array of memory ID strings that are relevant and should be used during execution. If none are relevant, set "selectedMemories": [].
3. Examine the available tools. If the request requires inspecting knowledge, querying missions, checking employees, or performing searches, select the appropriate tools.
4. If no tools are required, set "requiresTools": false and "steps": [].
5. Output Schema:
{
  "requiresTools": boolean,
  "goal": "Brief description of user's goal",
  "reasoning": "Reasoning behind this plan and memory selection",
  "memoryDecision": "use_memory" | "ignore_memory" | "request_fresh_information",
  "selectedMemories": ["mem_id_1"],
  "steps": [
    {
      "step": 1,
      "action": "Description of step action",
      "tool": "exact_tool_name",
      "arguments": { "param": "val" },
      "allowParallel": false
    }
  ]
}
`.trim();

export function buildPlannerUserPrompt(
  userQuery: string,
  availableTools: Array<{ name: string; description: string; parameters: unknown }>,
  memories?: Array<{ id: string; type: string; content: string; importance: number }>
): string {
  const memorySection = memories && memories.length > 0
    ? `\nRetrieved Candidate Memories:\n${JSON.stringify(memories, null, 2)}\n`
    : "\nNo Candidate Memories Found.\n";

  return `
User Request:
"${userQuery}"
${memorySection}
Available Domain Tools:
${JSON.stringify(availableTools, null, 2)}

Produce a structured JSON plan according to the system schema. Output ONLY valid JSON.
`.trim();
}
