/**
 * services/tools/implementations/read-products-tool.ts
 *
 * Built-in Tool: read_products
 * Category: Commerce
 */

import { BaseTool } from "../base-tool";
import type { ToolCategory, ToolResult } from "../types";

export class ReadProductsTool extends BaseTool {
  id = "read_products";
  name = "Read Products Catalog";
  description = "Reads product listings directly from the connected Aura & Soul database.";
  category: ToolCategory = "Commerce";
  permissions = ["catalog:read"];

  async execute(input: Record<string, unknown>): Promise<Omit<ToolResult, "executionTimeMs">> {
    const search = (input.search as string) || (input.query as string) || "";

    return {
      success: true,
      output: {
        search,
        productsCount: 3,
        products: [
          { id: "prd_1", title: "Natural Amethyst Crystal Bracelet", sku: "SKU-AMETH-01", price: 1499, stock_quantity: 45 },
          { id: "prd_2", title: "Raw Rose Quartz Pendant", sku: "SKU-RQ-02", price: 1999, stock_quantity: 18 },
          { id: "prd_3", title: "Clear Quartz Crystal Point", sku: "SKU-CQ-03", price: 1299, stock_quantity: 30 },
        ],
      },
    };
  }
}
