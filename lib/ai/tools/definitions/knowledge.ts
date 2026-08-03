/**
 * lib/ai/tools/definitions/knowledge.ts
 *
 * Knowledge domain tools wrapping existing RAG search and knowledge services.
 */

import { searchKnowledge } from "@/lib/rag/search";
import { getKnowledgeById } from "@/services/knowledge";
import type { AITool } from "../types";

export const searchKnowledgeTool: AITool<{ query: string; limit?: number }> = {
  definition: {
    name: "search_knowledge",
    description: "Search indexed workspace knowledge documents using semantic vector search.",
    category: "knowledge",
    requiredPermissions: ["READ_ONLY"],
    parameters: {
      query: {
        type: "string",
        description: "Semantic search query text.",
        required: true,
      },
      limit: {
        type: "number",
        description: "Maximum number of search results to return (default: 5).",
      },
    },
  },
  execute: async (args) => {
    const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 5;
    const results = await searchKnowledge({
      query: args.query,
      limit,
    });
    return results;
  },
};

export const getKnowledgeEntryTool: AITool<{ id: string }> = {
  definition: {
    name: "get_knowledge_entry",
    description: "Retrieve a specific knowledge entry by its unique ID.",
    category: "knowledge",
    requiredPermissions: ["READ_ONLY"],
    parameters: {
      id: {
        type: "string",
        description: "Unique Knowledge entry ID.",
        required: true,
      },
    },
  },
  execute: async (args) => {
    const entry = await getKnowledgeById(args.id);
    if (!entry) {
      return { found: false, message: `Knowledge entry '${args.id}' not found.` };
    }
    return { found: true, entry };
  },
};
