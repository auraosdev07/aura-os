/**
 * services/tools/base-tool.ts
 *
 * Base Tool Abstract Class
 * Every tool in Aura OS (search_database, search_memory, create_artifact, etc.)
 * extends this base class and implements execute().
 */

import type { ToolCategory, ToolExecutionContext, ToolResult } from "./types";

export abstract class BaseTool {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract category: ToolCategory;
  abstract permissions: string[];

  abstract execute(
    input: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Omit<ToolResult, "executionTimeMs">>;
}
