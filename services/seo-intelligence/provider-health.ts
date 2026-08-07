/**
 * services/seo-intelligence/provider-health.ts
 *
 * Provider Health & Telemetry Tracking Engine.
 * Manages provider health, success/failure counts, response times, and BLOCKED cooldowns.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { ProviderHealthRecord, ProviderStatus } from "./types";
import { SEO_INTEL_CONFIG } from "./config";

class ProviderHealthMonitor {
  private healthCache: Map<string, ProviderHealthRecord> = new Map();

  /** Record a completed provider run */
  async recordRun(
    providerId: string,
    providerName: string,
    durationMs: number,
    error: Error | null = null
  ): Promise<void> {
    let record = this.healthCache.get(providerId);

    if (!record) {
      record = {
        providerId,
        providerName,
        lastRun: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
        successRate: 1.0,
        averageResponseMs: durationMs,
        status: "HEALTHY",
      };
    }

    record.lastRun = new Date().toISOString();
    
    if (error) {
      record.failureCount++;
      record.lastError = error.message;

      // Check if blocked by 429, 403, or Captcha
      const isBlockedError =
        error.message.includes("429") ||
        error.message.includes("403") ||
        error.message.toLowerCase().includes("captcha");

      if (isBlockedError) {
        record.status = "BLOCKED";
        record.blockedUntil = new Date(Date.now() + SEO_INTEL_CONFIG.BLOCK_COOLDOWN_MS).toISOString();
      } else if (record.failureCount > 3) {
        record.status = "DEGRADED";
      }
    } else {
      record.successCount++;
      // Reset blocked status on clean success
      if (record.status === "BLOCKED" || record.status === "DEGRADED") {
        record.status = "HEALTHY";
        record.blockedUntil = undefined;
      }
    }

    const totalRuns = record.successCount + record.failureCount;
    record.successRate = totalRuns > 0 ? record.successCount / totalRuns : 1.0;
    record.averageResponseMs = (record.averageResponseMs * (totalRuns - 1) + durationMs) / totalRuns;

    this.healthCache.set(providerId, record);

    // Persist asynchronously to DB
    this.persistToDb(record).catch((err) =>
      console.error(`[PROVIDER HEALTH] Failed to persist health for ${providerId}:`, err)
    );
  }

  /** Check if provider is healthy or blocked */
  async isProviderHealthy(providerId: string): Promise<boolean> {
    const record = this.healthCache.get(providerId);
    if (!record) return true;

    if (record.status === "DISABLED") return false;
    if (record.status === "BLOCKED" && record.blockedUntil) {
      if (new Date(record.blockedUntil).getTime() > Date.now()) {
        return false; // Still in cooldown
      } else {
        // Cooldown expired
        record.status = "HEALTHY";
        record.blockedUntil = undefined;
      }
    }
    return true;
  }

  /** Get health record for a provider */
  getHealth(providerId: string): ProviderHealthRecord | undefined {
    return this.healthCache.get(providerId);
  }

  /** Get all provider health records */
  getAllHealth(): ProviderHealthRecord[] {
    return Array.from(this.healthCache.values());
  }

  private async persistToDb(record: ProviderHealthRecord): Promise<void> {
    try {
      const { supabase } = await getServerContext();
      if (!supabase || typeof supabase.from !== "function") return;

      await supabase.from("provider_health").upsert(
        {
          provider_id: record.providerId,
          provider_name: record.providerName,
          last_run: record.lastRun,
          success_count: record.successCount,
          failure_count: record.failureCount,
          success_rate: record.successRate,
          average_response_ms: record.averageResponseMs,
          last_error: record.lastError || null,
          status: record.status,
          blocked_until: record.blockedUntil || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider_id" }
      );
    } catch {
      // Non-blocking telemetry DB write
    }
  }
}

export const providerHealthMonitor = new ProviderHealthMonitor();
