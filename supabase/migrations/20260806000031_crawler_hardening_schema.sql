-- Migration: 20260806000031_crawler_hardening_schema.sql
-- Description: Adds crawl history versioning, analytics metrics, and fingerprint columns to crawl_jobs and crawl_pages.

-- 1. Update status constraint and add analytics/versioning columns to public.crawl_jobs
ALTER TABLE public.crawl_jobs DROP CONSTRAINT IF EXISTS crawl_jobs_status_check;
ALTER TABLE public.crawl_jobs ADD CONSTRAINT crawl_jobs_status_check CHECK (
  status IN ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED')
);

ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS parent_job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE SET NULL;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS pages_per_second DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS average_response_time_ms INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS skipped_pages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS unchanged_pages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS rendered_pages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.crawl_jobs ADD COLUMN IF NOT EXISTS duplicate_count INTEGER NOT NULL DEFAULT 0;

-- 2. Add fingerprint, version, and rendering flags to public.crawl_pages
ALTER TABLE public.crawl_pages ADD COLUMN IF NOT EXISTS is_unchanged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.crawl_pages ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.crawl_pages ADD COLUMN IF NOT EXISTS fingerprint TEXT;
ALTER TABLE public.crawl_pages ADD COLUMN IF NOT EXISTS is_rendered BOOLEAN NOT NULL DEFAULT false;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_target ON public.crawl_jobs(target_url);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_version ON public.crawl_jobs(version);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_fingerprint ON public.crawl_pages(fingerprint);
