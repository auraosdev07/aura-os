/**
 * lib/ai/tools/definitions/mission.ts
 *
 * Mission domain tools wrapping existing mission services.
 */

import { getMissions, getMission } from "@/services/mission";
import type { MissionStatus } from "@/types/database";
import type { AITool } from "../types";

export const listMissionsTool: AITool<{ status?: string; limit?: number }> = {
  definition: {
    name: "list_missions",
    description: "List active workforce missions with optional status filtering.",
    category: "mission",
    requiredPermissions: ["READ_ONLY"],
    parameters: {
      status: {
        type: "string",
        description: "Filter by status: DRAFT, PLANNING, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED, ON_HOLD.",
        enum: ["DRAFT", "PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED", "ON_HOLD"],
      },
      limit: {
        type: "number",
        description: "Maximum number of missions to return.",
      },
    },
  },
  execute: async (args) => {
    const filters = args.status ? { status: args.status as MissionStatus } : undefined;
    const missions = await getMissions(filters);
    if (typeof args.limit === "number" && args.limit > 0) {
      return missions.slice(0, args.limit);
    }
    return missions;
  },
};

export const getMissionStatusTool: AITool<{ missionId: string }> = {
  definition: {
    name: "get_mission_status",
    description: "Retrieve complete status details and assignments for a specific mission.",
    category: "mission",
    requiredPermissions: ["READ_ONLY"],
    parameters: {
      missionId: {
        type: "string",
        description: "Unique Mission ID.",
        required: true,
      },
    },
  },
  execute: async (args) => {
    const mission = await getMission(args.missionId);
    if (!mission) {
      return { found: false, message: `Mission '${args.missionId}' not found.` };
    }
    return { found: true, mission };
  },
};
