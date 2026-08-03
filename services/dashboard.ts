"use server";

/**
 * services/dashboard.ts
 *
 * Live Aura & Soul Business Dashboard Service.
 * Fetches real-time metrics directly from connected Aura & Soul Supabase project.
 * Read-only analytics with independent fault tolerance per card.
 */

import { getAuraSoulDashboardAnalytics } from "@/services/connectors/aura-soul/dashboard";
import type { AuraSoulDashboardData } from "@/types/dashboard";

export async function fetchLiveDashboardService(): Promise<AuraSoulDashboardData> {
  return getAuraSoulDashboardAnalytics();
}

export async function buildDashboardView(): Promise<AuraSoulDashboardData> {
  return getAuraSoulDashboardAnalytics();
}
