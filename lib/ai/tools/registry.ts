/**
 * lib/ai/tools/registry.ts
 *
 * AI tool registration and resolution registry.
 */

import type { AITool } from "./types";

export class AIToolRegistry {
  private static instance: AIToolRegistry;
  private tools = new Map<string, AITool>();

  private constructor() {}

  public static getInstance(): AIToolRegistry {
    if (!AIToolRegistry.instance) {
      AIToolRegistry.instance = new AIToolRegistry();
    }
    return AIToolRegistry.instance;
  }

  public registerTool(tool: AITool): void {
    if (!tool || !tool.definition || !tool.definition.name) {
      throw new Error("Cannot register invalid AITool.");
    }
    this.tools.set(tool.definition.name, tool);
  }

  public getTool(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  public listTools(): AITool[] {
    return Array.from(this.tools.values());
  }
}

export const aiToolRegistry = AIToolRegistry.getInstance();
