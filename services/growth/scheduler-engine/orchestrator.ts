/**
 * services/growth/scheduler-engine/orchestrator.ts
 *
 * Configurable Scheduler Engine for Phase 6.1 Module 1.
 * Supports configurable jobs, provider frequency, last run, next run, retries, manual execution triggers, and job run history logs.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { ScheduledJobDTO, JobRunDTO } from "../types";
import { trendIntelligenceEngine } from "../trend-engine/orchestrator";

export class SchedulerEngine {
  async getScheduledJobs(): Promise<ScheduledJobDTO[]> {
    const defaultJobs: ScheduledJobDTO[] = [
      { id: "job_google_trends", providerId: "google_trends", cronSchedule: "0 */6 * * *", nextRunAt: new Date(Date.now() + 3600000).toISOString(), status: "IDLE", retryCount: 0 },
      { id: "job_pinterest", providerId: "pinterest", cronSchedule: "0 */6 * * *", nextRunAt: new Date(Date.now() + 7200000).toISOString(), status: "IDLE", retryCount: 0 },
      { id: "job_amazon", providerId: "amazon", cronSchedule: "0 */6 * * *", nextRunAt: new Date(Date.now() + 10800000).toISOString(), status: "IDLE", retryCount: 0 },
      { id: "job_reddit", providerId: "reddit", cronSchedule: "0 */6 * * *", nextRunAt: new Date(Date.now() + 14400000).toISOString(), status: "IDLE", retryCount: 0 },
    ];

    try {
      const { supabase } = await getServerContext();
      if (supabase && typeof supabase.from === "function") {
        const { data: rows } = await supabase.from("scheduled_jobs").select("*");
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            providerId: r.provider_id,
            cronSchedule: r.cron_schedule,
            lastRunAt: r.last_run_at,
            nextRunAt: r.next_run_at,
            status: r.status,
            retryCount: r.retry_count,
          }));
        }
      }
    } catch (err) {
      console.error("[SCHEDULER DB WARN]:", err);
    }

    return defaultJobs;
  }

  async triggerManualRun(jobId: string): Promise<JobRunDTO> {
    const startedAt = new Date().toISOString();
    try {
      const trends = await trendIntelligenceEngine.aggregateAndMergeTrends("Gems & Jewelry");
      const completedAt = new Date().toISOString();

      const runRecord: JobRunDTO = {
        jobId,
        status: "SUCCESS",
        itemsProcessed: trends.length,
        startedAt,
        completedAt,
      };

      const { supabase } = await getServerContext();
      if (supabase && typeof supabase.from === "function") {
        await supabase.from("job_runs").insert({
          job_id: jobId,
          status: "SUCCESS",
          items_processed: trends.length,
          started_at: startedAt,
          completed_at: completedAt,
        });

        await supabase.from("scheduled_jobs").update({
          last_run_at: completedAt,
          status: "IDLE",
          retry_count: 0,
        }).eq("id", jobId);
      }

      return runRecord;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Manual run failure";
      return {
        jobId,
        status: "FAILED",
        itemsProcessed: 0,
        errorMessage: msg,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }
  }
}

export const schedulerEngine = new SchedulerEngine();
