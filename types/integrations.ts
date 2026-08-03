/**
 * types/integrations.ts
 *
 * Reusable Integration Data Model for Aura OS.
 * Designed for Aura & Soul, Google, Meta, Gmail, WhatsApp, Razorpay, etc.
 */

export type IntegrationStatus = "NOT_CONFIGURED" | "CONNECTED" | "DISCONNECTED" | "COMING_SOON";

export type IntegrationCategory = "E-Commerce" | "Marketing" | "Communication" | "Payments" | "General";

export interface IntegrationRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  category: IntegrationCategory;
  description: string | null;
  icon_name: string | null;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_tested_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationCardDefinition {
  slug: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  iconName: string;
  defaultStatus: IntegrationStatus;
  detailHref?: string;
}

export interface AuraSoulConfig {
  supabase_url: string;
  supabase_project_id: string;
  service_role_key: string;
}
