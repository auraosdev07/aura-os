import type { SpecializedAgent, AgentInput, AgentOutput } from "../manager/types";
import { executeAgentHelper } from "./agent-runner";

export const researchAgent: SpecializedAgent = {
  id: "research",
  name: "Research Agent",
  description: "Specialized in researching topics, knowledge bases, and domain data.",
  systemPrompt: "You are the Research Agent. Your goal is to gather detailed, accurate research and knowledge.",
  allowedTools: ["search_knowledge", "get_knowledge_entry", "list_missions", "list_employees"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    return executeAgentHelper(this, input);
  },
};
