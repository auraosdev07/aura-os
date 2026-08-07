-- Migration: 20260806000036_editorial_system.sql
-- Description: Creates database tables for Phase 5.0 Editorial Workflow & Publishing System.

-- 1. Editorial Queue Table
CREATE TABLE IF NOT EXISTS public.editorial_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Draft', 'Under Review', 'Approved', 'Rejected', 'Scheduled', 'Published')),
  version INTEGER NOT NULL DEFAULT 1,
  validation_score REAL NOT NULL DEFAULT 0.0,
  eeat_score REAL NOT NULL DEFAULT 85.0,
  readability_score REAL NOT NULL DEFAULT 75.0,
  word_count INTEGER NOT NULL DEFAULT 0,
  assigned_editor TEXT,
  rejection_reason TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_editorial_queue_status ON public.editorial_queue(status);
CREATE INDEX IF NOT EXISTS idx_editorial_queue_kw ON public.editorial_queue(normalized_keyword);

-- 2. Editorial Reviews History Table
CREATE TABLE IF NOT EXISTS public.editorial_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.editorial_queue(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL DEFAULT 'Human Editor',
  action TEXT NOT NULL CHECK (action IN ('APPROVED', 'REJECTED', 'REWRITE_REQUESTED', 'STATUS_CHANGED', 'EDITED')),
  notes TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Publish Jobs Table (Must be human approved)
CREATE TABLE IF NOT EXISTS public.publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.editorial_queue(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL DEFAULT 'markdown-export',
  human_approved_by TEXT NOT NULL,
  is_human_approved BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  target_url TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 4. Publish Providers Table
CREATE TABLE IF NOT EXISTS public.publish_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Publish History Table
CREATE TABLE IF NOT EXISTS public.publish_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.editorial_queue(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  published_url TEXT,
  version INTEGER NOT NULL,
  published_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Grant Access & Disable RLS for Internal Server Operations
GRANT ALL ON TABLE public.editorial_queue TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.editorial_reviews TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.publish_jobs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.publish_providers TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.publish_history TO postgres, anon, authenticated, service_role;

ALTER TABLE public.editorial_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_history DISABLE ROW LEVEL SECURITY;

-- Seed Default Exporter Providers
INSERT INTO public.publish_providers (id, name, type, is_enabled)
VALUES
  ('markdown-export', 'Markdown Document Export', 'FILE_EXPORT', true),
  ('html-export', 'HTML 5 Bundle Export', 'FILE_EXPORT', true),
  ('json-export', 'JSON Payload Export', 'FILE_EXPORT', true),
  ('wordpress', 'WordPress REST API', 'CMS_PLUGIN', true),
  ('shopify-blog', 'Shopify Blog API', 'ECOMMERCE_CMS', true),
  ('ghost', 'Ghost Content API', 'CMS_PLUGIN', true),
  ('notion', 'Notion Page Exporter', 'WORKSPACE_EXPORT', true)
ON CONFLICT (id) DO NOTHING;
