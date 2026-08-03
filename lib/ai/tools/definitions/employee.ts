/**
 * lib/ai/tools/definitions/employee.ts
 *
 * Employee domain tools wrapping existing employee services.
 */

import { getEmployees, getEmployee } from "@/services/employee";
import type { AITool } from "../types";

export const listEmployeesTool: AITool<{ limit?: number }> = {
  definition: {
    name: "list_employees",
    description: "List active autonomous AI employees in the workspace.",
    category: "employee",
    requiredPermissions: ["READ_ONLY"],
    parameters: {
      limit: {
        type: "number",
        description: "Maximum number of employees to return.",
      },
    },
  },
  execute: async (args) => {
    const employees = await getEmployees();
    if (typeof args.limit === "number" && args.limit > 0) {
      return employees.slice(0, args.limit);
    }
    return employees;
  },
};

export const getEmployeeProfileTool: AITool<{ employeeId: string }> = {
  definition: {
    name: "get_employee_profile",
    description: "Retrieve full profile information, capabilities, and assignment metrics for a specific employee.",
    category: "employee",
    requiredPermissions: ["READ_ONLY"],
    parameters: {
      employeeId: {
        type: "string",
        description: "Unique Employee ID.",
        required: true,
      },
    },
  },
  execute: async (args) => {
    const employee = await getEmployee(args.employeeId);
    if (!employee) {
      return { found: false, message: `Employee '${args.employeeId}' not found.` };
    }
    return { found: true, employee };
  },
};
