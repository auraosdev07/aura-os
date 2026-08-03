import type { SpecializedAgent, AgentInput, AgentOutput } from "../manager/types";
import type { ToolContext } from "../tools/types";
import type { AIMessage } from "../types";
import { aiToolRegistry } from "../tools/registry";
import { generatePlan } from "../planner/planner";
import { runAgentLoop } from "../agent/loop";
import { fetchWithGeminiFallback } from "../providers/gemini-fallback";

export async function executeAgentHelper(
  agent: SpecializedAgent,
  input: AgentInput
): Promise<AgentOutput> {
  console.log(`\n↓\n${agent.name} ✔`);

  const toolContext: ToolContext = input.context || { ownerId: "system" };
  const enabledToolDefs = aiToolRegistry
    .getEnabledToolDefinitions(toolContext)
    .filter((t) => agent.allowedTools.includes(t.name));

  const providerCallFn = async (loopMessages: AIMessage[], formattedTools?: unknown[]) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const contents: { role: string; parts: { text: string }[] }[] = [];

    for (const msg of loopMessages) {
      if (msg.role !== "system") {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const bodyObj: Record<string, unknown> = {
      contents,
      systemInstruction: { parts: [{ text: agent.systemPrompt }] },
    };
    if (formattedTools && formattedTools.length > 0) bodyObj.tools = formattedTools;

    const { response: res } = await fetchWithGeminiFallback({
      apiKey,
      endpointSuffix: ":generateContent",
      fetchOptions: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj),
      },
      requestedModel: input.model,
    });

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const textPart = parts.find((p: Record<string, unknown>) => typeof p.text === "string");
    return { text: textPart ? textPart.text : "", rawResponse: data };
  };

  const plan = await generatePlan({
    userQuery: input.userQuery,
    availableTools: enabledToolDefs.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })),
    memories: [],
    provider: "gemini",
    model: input.model,
  });

  const effectiveToolDefs = plan.requiresTools ? enabledToolDefs : [];

  const loopResult = await runAgentLoop({
    messages: [
      { role: "system", content: agent.systemPrompt },
      { role: "user", content: input.userQuery },
    ],
    provider: "gemini",
    toolDefinitions: effectiveToolDefs,
    context: toolContext,
    maxIterations: 4,
    providerCallFn,
  });

  return {
    agentId: agent.id,
    agentName: agent.name,
    text: loopResult.finalText || loopResult.text || "",
  };
}
