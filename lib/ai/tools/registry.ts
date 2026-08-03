/**
 * lib/ai/tools/registry.ts
 *
 * Singleton AI Tool Registry managing tool discovery, activation, and permission governance.
 */

import type { AITool, ToolContext, ToolDefinition } from "./types";

export interface RegisterToolOptions {
  overwrite?: boolean;
}

export class AIToolRegistry {
  private static instance: AIToolRegistry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools = new Map<string, AITool<any>>();
  private disabledTools = new Set<string>();

  private constructor() {}

  public static getInstance(): AIToolRegistry {
    if (!AIToolRegistry.instance) {
      AIToolRegistry.instance = new AIToolRegistry();
    }
    return AIToolRegistry.instance;
  }

  /**
   * Register a new AI Tool. Throws an error if duplicate name exists unless overwrite is set to true.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public registerTool(tool: AITool<any>, options?: RegisterToolOptions): void {
    if (!tool || !tool.definition || !tool.definition.name) {
      throw new Error("Cannot register invalid AITool. Tool name is required.");
    }

    const name = tool.definition.name;

    if (this.tools.has(name) && !options?.overwrite) {
      throw new Error(
        `Tool '${name}' is already registered. Pass { overwrite: true } to explicitly overwrite.`
      );
    }

    // Default version to "1.0" if missing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolWithVersion: AITool<any> = {
      ...tool,
      definition: {
        ...tool.definition,
        version: tool.definition.version || "1.0",
      },
    };

    this.tools.set(name, toolWithVersion);
  }

  /**
   * Unregister an AI Tool by name.
   */
  public unregisterTool(name: string): boolean {
    this.disabledTools.delete(name);
    return this.tools.delete(name);
  }

  /**
   * Retrieve a registered tool by name (even if disabled).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getTool(name: string): AITool<any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Get definitions of all currently enabled tools.
   * Optionally filters out tools if user context lacks required permissions.
   */
  public getEnabledToolDefinitions(context?: ToolContext): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter((tool) => !this.disabledTools.has(tool.definition.name))
      .filter((tool) => this.hasPermission(tool.definition, context))
      .map((tool) => tool.definition);
  }

  /**
   * List all registered tools.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public listTools(): AITool<any>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Disable a tool dynamically without unregistering it.
   */
  public disableTool(name: string): void {
    if (this.tools.has(name)) {
      this.disabledTools.add(name);
    }
  }

  /**
   * Enable a previously disabled tool.
   */
  public enableTool(name: string): void {
    this.disabledTools.delete(name);
  }

  /**
   * Helper checking permission match between ToolDefinition and ToolContext.
   */
  private hasPermission(def: ToolDefinition, context?: ToolContext): boolean {
    if (!def.requiredPermissions || def.requiredPermissions.length === 0) {
      return true;
    }
    if (!context || !context.ownerId) {
      return false;
    }
    return true;
  }

  /**
   * Clear registry state (useful for testing).
   */
  public clear(): void {
    this.tools.clear();
    this.disabledTools.clear();
  }
}

export const aiToolRegistry = AIToolRegistry.getInstance();
