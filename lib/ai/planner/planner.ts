/**
 * lib/ai/planner/planner.ts
 *
 * Planning Agent implementation using generateJSON / LLM provider call with retry and fallback.
 */

import { generateJSON } from "@/lib/ai/client";
import { PLANNER_SYSTEM_PROMPT, buildPlannerUserPrompt } from "./planner-prompts";
import type { GeneratePlanOptions, StructuredPlan } from "./planner-types";

/**
 * Generate a structured plan for a user request.
 * Guaranteed to return a valid StructuredPlan object (falling back gracefully if needed).
 */
export async function generatePlan(
  options: GeneratePlanOptions
): Promise<StructuredPlan> {
  const { userQuery, availableTools, memories, provider = "gemini", model } = options;

  const prompt = buildPlannerUserPrompt(userQuery, availableTools, memories);

  // Attempt 1: Call generateJSON
  try {
    const plan = await generateJSON<StructuredPlan>(
      {
        messages: [
          { role: "system", content: PLANNER_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        model,
        temperature: 0.1,
      },
      provider
    );

    if (validatePlan(plan)) {
      return sanitizePlan(plan);
    }
  } catch (err) {
    console.warn("[PLANNER WARNING] Attempt 1 failed:", err);
  }

  // Attempt 2: Retry once with explicit formatting enforcement
  try {
    const retryPlan = await generateJSON<StructuredPlan>(
      {
        messages: [
          { role: "system", content: `${PLANNER_SYSTEM_PROMPT}\nIMPORTANT: Your previous output was invalid. Reply with ONLY valid JSON strictly matching the schema.` },
          { role: "user", content: prompt },
        ],
        model,
        temperature: 0.0,
      },
      provider
    );

    if (validatePlan(retryPlan)) {
      return sanitizePlan(retryPlan);
    }
  } catch (err) {
    console.warn("[PLANNER WARNING] Attempt 2 retry failed:", err);
  }

  // Fallback: If planning fails or is unneeded, return fallback plan requiring no tools
  return {
    requiresTools: availableTools.length > 0,
    goal: "Process user query directly",
    reasoning: "Fallback plan due to unconstrained or simple user prompt",
    memoryDecision: "ignore_memory",
    selectedMemories: [],
    steps: [],
  };
}

/**
 * Validate that the returned object satisfies the StructuredPlan schema.
 */
function validatePlan(plan: unknown): plan is StructuredPlan {
  if (!plan || typeof plan !== "object") return false;
  const p = plan as Partial<StructuredPlan>;

  if (typeof p.goal !== "string") return false;
  if (typeof p.requiresTools !== "boolean" && !Array.isArray(p.steps)) return false;

  if (Array.isArray(p.steps)) {
    for (const s of p.steps) {
      if (typeof s !== "object" || !s) return false;
      if (typeof s.tool !== "string") return false;
    }
  }

  return true;
}

/**
 * Sanitize plan properties.
 */
function sanitizePlan(plan: StructuredPlan): StructuredPlan {
  const validDecisions = ["use_memory", "ignore_memory", "request_fresh_information"];
  const memoryDecision = validDecisions.includes(plan.memoryDecision || "")
    ? plan.memoryDecision
    : plan.selectedMemories && plan.selectedMemories.length > 0
    ? "use_memory"
    : "ignore_memory";

  return {
    requiresTools: Boolean(plan.requiresTools ?? (plan.steps && plan.steps.length > 0)),
    goal: plan.goal || "Fulfill user request",
    reasoning: plan.reasoning || "Execute plan steps",
    memoryDecision,
    selectedMemories: Array.isArray(plan.selectedMemories) ? plan.selectedMemories : [],
    steps: Array.isArray(plan.steps) ? plan.steps : [],
  };
}
