import { z } from "zod";

export const ProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().optional(),
});

export const ManagerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  department: z.string().min(2, "Department is required"),
  email: z.string().email("Invalid email").optional().nullable(),
});

export const EmployeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  manager_id: z.string().uuid("Invalid manager selected").optional().nullable(),
});

export const MissionSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]).default("PLANNING"),
});

export const KnowledgeEntrySchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(10, "Content is too short"),
  layer: z.enum(["CORE", "DOMAIN", "PROJECT", "TEAM"]),
  mission_id: z.string().uuid().optional().nullable(),
});
