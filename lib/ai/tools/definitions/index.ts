/**
 * lib/ai/tools/definitions/index.ts
 *
 * Domain tools registry bootstrapper. Automatically registers all Knowledge, Mission,
 * and Employee tools into AIToolRegistry.
 */

import { aiToolRegistry } from "../registry";
import { searchKnowledgeTool, getKnowledgeEntryTool } from "./knowledge";
import { listMissionsTool, getMissionStatusTool } from "./mission";
import { listEmployeesTool, getEmployeeProfileTool } from "./employee";

export const allDomainTools = [
  searchKnowledgeTool,
  getKnowledgeEntryTool,
  listMissionsTool,
  getMissionStatusTool,
  listEmployeesTool,
  getEmployeeProfileTool,
];

// Automatically register every domain tool into AIToolRegistry
allDomainTools.forEach((tool) => {
  aiToolRegistry.registerTool(tool, { overwrite: true });
});

export {
  searchKnowledgeTool,
  getKnowledgeEntryTool,
  listMissionsTool,
  getMissionStatusTool,
  listEmployeesTool,
  getEmployeeProfileTool,
};
