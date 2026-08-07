/**
 * types/agent.ts
 *
 * Single source of truth for Agent Runtime Foundation types & constants.
 */

export type AgentStatus = "IDLE" | "WORKING" | "PAUSED" | "ERROR";
export type AgentMemoryScope = "private" | "shared";
export type AgentRunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type AgentLogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface AgentRow {
  id: string;
  owner_id: string | null;
  name: string;
  role: string;
  description: string | null;
  status: AgentStatus;
  model: string;
  memory_scope: AgentMemoryScope;
  connected_integrations: string[];
  enabled_tools: string[];
  current_task: string | null;
  last_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentToolRow {
  id: string;
  agent_id: string;
  tool_name: string;
  tool_type: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
}

export interface AgentMemoryRow {
  id: string;
  owner_id: string | null;
  agent_id: string | null;
  scope: AgentMemoryScope;
  key: string;
  value: Record<string, unknown> | string | number | boolean | unknown[];
  created_at: string;
  updated_at: string;
}

export interface AgentRunRow {
  id: string;
  agent_id: string;
  prompt: string | null;
  status: AgentRunStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number;
  output: Record<string, unknown> | string | null;
  error_message: string | null;
  created_at: string;
}

export interface AgentLogRow {
  id: string;
  agent_id: string;
  run_id: string | null;
  level: AgentLogLevel;
  event_type: string;
  message: string;
  details: Record<string, unknown> | string | null;
  created_at: string;
}

export interface FullAgentDetails {
  agent: AgentRow;
  tools: AgentToolRow[];
  memory: AgentMemoryRow[];
  runs: AgentRunRow[];
  logs: AgentLogRow[];
}

export interface CreateAgentPayload {
  name: string;
  role: string;
  description?: string;
  model?: string;
  memory_scope?: AgentMemoryScope;
  connected_integrations?: string[];
  enabled_tools?: string[];
}

export const DEFAULT_PLUGGABLE_TOOLS = [
  { name: "Database", description: "Query and inspect external database schemas & data", type: "builtin", category: "data" },
  { name: "Products", description: "Read and manage external product catalog & stock", type: "builtin", category: "data" },
  { name: "Knowledge", description: "Access organizational RAG knowledge base & documentation", type: "builtin", category: "data" },
  { name: "Memory", description: "Read & write persistent agent memory (shared / private)", type: "builtin", category: "data" },
  { name: "Search", description: "Web search and market research discovery tool", type: "builtin", category: "search" },
  { name: "Request Agent Info", description: "Inter-agent communication protocol (ACP v1) to request dataset clarification", type: "builtin", category: "communication" },
  { name: "MCP Client", description: "Connect to Model Context Protocol servers", type: "mcp", category: "mcp" },
  { name: "Python Exec", description: "Execute isolated Python scripts and analysis", type: "execution", category: "execution" },
] as const;

export const DEFAULT_AGENTS_SEED = [
  {
    name: "CEO Agent",
    role: "Chief Executive Officer & Orchestrator",
    description: "High-level strategic vision, cross-agent coordination, and corporate decision making.",
    model: "gpt-4o",
    memory_scope: "shared" as AgentMemoryScope,
    connected_integrations: ["Aura & Soul"],
    enabled_tools: ["Database", "Products", "Knowledge", "Memory", "Search", "Request Agent Info"],
    current_task: "Monitoring overall business operations and key metrics.",
  },
  {
    name: "SEO Agent",
    role: "Search Engine Optimization Specialist",
    description: "Keyword tracking, search rankings analysis, canonical URLs, and organic visibility growth.",
    model: "claude-3-5-sonnet",
    memory_scope: "shared" as AgentMemoryScope,
    connected_integrations: ["Aura & Soul", "Google"],
    enabled_tools: ["Products", "Knowledge", "Search", "Request Agent Info"],
    current_task: "Auditing product SEO titles and OpenGraph tags.",
  },
  {
    name: "Marketing Agent",
    role: "Growth & Campaign Manager",
    description: "Campaign design, target audience segmentation, promotional offers, and brand positioning.",
    model: "gpt-4o",
    memory_scope: "shared" as AgentMemoryScope,
    connected_integrations: ["Meta", "Google"],
    enabled_tools: ["Products", "Knowledge", "Search", "Request Agent Info"],
    current_task: "Evaluating promotional coupon strategies.",
  },
  {
    name: "Content Agent",
    role: "Editorial & Product Copywriter",
    description: "Product descriptions, blog post generation, documentation, and storytelling.",
    model: "claude-3-5-sonnet",
    memory_scope: "private" as AgentMemoryScope,
    connected_integrations: ["Aura & Soul"],
    enabled_tools: ["Products", "Knowledge", "Request Agent Info"],
    current_task: "Crafting description templates for crystal products.",
  },
  {
    name: "Inventory Agent",
    role: "Supply Chain & Stock Controller",
    description: "Stock level monitoring, low-stock threshold alerts, and reorder projections.",
    model: "gpt-4o-mini",
    memory_scope: "shared" as AgentMemoryScope,
    connected_integrations: ["Aura & Soul"],
    enabled_tools: ["Database", "Products", "Memory", "Request Agent Info"],
    current_task: "Checking variant inventory levels and low-stock warnings.",
  },
  {
    name: "Customer Support Agent",
    role: "Customer Success & Consultation Triage",
    description: "Consultation request triage, inquiry response, and customer satisfaction monitoring.",
    model: "gpt-4o-mini",
    memory_scope: "private" as AgentMemoryScope,
    connected_integrations: ["Aura & Soul", "WhatsApp", "Gmail"],
    enabled_tools: ["Products", "Knowledge", "Request Agent Info"],
    current_task: "Reviewing pending customer consultation inquiries.",
  },
  {
    name: "Analytics Agent",
    role: "Business Intelligence & Telemetry Analyst",
    description: "Sales revenue telemetry, conversion funnel tracking, and operational trend reporting.",
    model: "gemini-1.5-pro",
    memory_scope: "shared" as AgentMemoryScope,
    connected_integrations: ["Aura & Soul", "Razorpay"],
    enabled_tools: ["Database", "Products", "Knowledge", "Memory", "Request Agent Info"],
    current_task: "Compiling 7-day sales and order velocity analytics.",
  },
];
