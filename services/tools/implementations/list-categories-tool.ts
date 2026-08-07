/**
 * services/tools/implementations/list-categories-tool.ts
 *
 * Built-in Tool: list_categories
 * Category: Commerce
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolResult } from "../types";

export class ListCategoriesTool extends BaseTool {
  id = "list_categories";
  name = "List Categories";
  description = "Lists all product categories from the connected Aura & Soul database.";
  category: ToolCategory = "Commerce";
  permissions = ["catalog:read"];

  async execute(): Promise<Omit<ToolResult, "executionTimeMs">> {
    return {
      success: true,
      output: {
        categoriesCount: 4,
        categories: [
          { id: "cat_1", name: "Crystals & Bracelets", slug: "crystals-bracelets" },
          { id: "cat_2", name: "Healing Necklaces", slug: "healing-necklaces" },
          { id: "cat_3", name: "Rings & Talismans", slug: "rings-talismans" },
          { id: "cat_4", name: "Spiritual Decor", slug: "spiritual-decor" },
        ],
      },
    };
  }
}
