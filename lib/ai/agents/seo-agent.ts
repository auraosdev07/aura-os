import type { SpecializedAgent, AgentInput, AgentOutput } from "../manager/types";
import { executeAgentHelper } from "./agent-runner";

export const seoAgent: SpecializedAgent = {
  id: "seo",
  name: "SEO Agent",
  description: "Specialized in search engine optimization, keywords, meta tags, and content optimization.",
  systemPrompt: "You are the SEO Agent. Your goal is to construct high-performing SEO strategies, target keywords, and optimization guidelines.",
  allowedTools: ["search_knowledge", "get_knowledge_entry"],

  async execute(input: AgentInput): Promise<AgentOutput> {
    return executeAgentHelper(this, input);
  },
};
