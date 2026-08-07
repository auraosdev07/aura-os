-- Migration: 20260806000038_website_sync.sql
-- Description: Creates sync metadata tables (sync_history, website_snapshots, website_sync_jobs) for Website Sync Engine.

-- 1. Sync History Table
CREATE TABLE IF NOT EXISTS public.sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('PRODUCT', 'BLOG', 'SEO_METADATA', 'SCHEMA')),
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('UPDATE_PARTIAL', 'UPDATE_FULL', 'CREATE_DRAFT', 'PUBLISH', 'ROLLBACK')),
  previous_version INTEGER NOT NULL DEFAULT 1,
  new_version INTEGER NOT NULL DEFAULT 1,
  synced_by TEXT NOT NULL DEFAULT 'Aura OS Sync Engine',
  diff_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sync_history_res ON public.sync_history(resource_type, resource_id);

-- 2. Website Snapshots Table (for rollback)
CREATE TABLE IF NOT EXISTS public.website_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('PRODUCT', 'BLOG', 'SEO_METADATA', 'SCHEMA')),
  resource_id TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_website_snapshots_res ON public.website_snapshots(resource_type, resource_id);

-- 3. Website Sync Jobs Table
CREATE TABLE IF NOT EXISTS public.website_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('PRODUCT_SYNC', 'BLOG_SYNC', 'SEO_SYNC', 'ROLLBACK')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED')),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  editorial_queue_id UUID REFERENCES public.editorial_queue(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_website_sync_jobs_status ON public.website_sync_jobs(status);

-- Grant Access & Disable RLS for Internal Server Operations
GRANT ALL ON TABLE public.sync_history TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.website_snapshots TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.website_sync_jobs TO postgres, anon, authenticated, service_role;

ALTER TABLE public.sync_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sync_jobs DISABLE ROW LEVEL SECURITY;
