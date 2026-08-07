-- Migration: 20260806000030_crawler_storage_schema.sql
-- Description: Creates crawl_jobs, crawl_pages, crawl_links, crawl_images, and crawl_metadata tables for Phase 4A Real Data Collection Layer.

-- 1. Create crawl_jobs table
CREATE TABLE IF NOT EXISTS public.crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  max_depth INTEGER NOT NULL DEFAULT 2,
  max_pages INTEGER NOT NULL DEFAULT 20,
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  sitemap_found BOOLEAN NOT NULL DEFAULT false,
  robots_found BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create crawl_pages table
CREATE TABLE IF NOT EXISTS public.crawl_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  final_url TEXT NOT NULL,
  redirect_chain JSONB DEFAULT '[]'::jsonb,
  title TEXT,
  meta_title TEXT,
  meta_description TEXT,
  canonical TEXT,
  language TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 0,
  h1_tags JSONB DEFAULT '[]'::jsonb,
  h2_tags JSONB DEFAULT '[]'::jsonb,
  h3_tags JSONB DEFAULT '[]'::jsonb,
  h4_tags JSONB DEFAULT '[]'::jsonb,
  h5_tags JSONB DEFAULT '[]'::jsonb,
  h6_tags JSONB DEFAULT '[]'::jsonb,
  opengraph JSONB DEFAULT '{}'::jsonb,
  twitter_cards JSONB DEFAULT '{}'::jsonb,
  json_ld JSONB DEFAULT '[]'::jsonb,
  page_size_bytes INTEGER NOT NULL DEFAULT 0,
  content_type TEXT,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  depth INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT,
  etag TEXT,
  last_modified TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create crawl_links table
CREATE TABLE IF NOT EXISTS public.crawl_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  source_page_id UUID REFERENCES public.crawl_pages(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  is_nofollow BOOLEAN NOT NULL DEFAULT false,
  is_ugc BOOLEAN NOT NULL DEFAULT false,
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create crawl_images table
CREATE TABLE IF NOT EXISTS public.crawl_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.crawl_pages(id) ON DELETE CASCADE,
  src TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create crawl_metadata table
CREATE TABLE IF NOT EXISTS public.crawl_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.crawl_pages(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_owner ON public.crawl_jobs(owner_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON public.crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_job ON public.crawl_pages(job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_url ON public.crawl_pages(url);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_hash ON public.crawl_pages(content_hash);
CREATE INDEX IF NOT EXISTS idx_crawl_links_job ON public.crawl_links(job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_links_source ON public.crawl_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_crawl_images_page ON public.crawl_images(page_id);
CREATE INDEX IF NOT EXISTS idx_crawl_metadata_page ON public.crawl_metadata(page_id);

-- Enable RLS
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Manage crawl jobs" ON public.crawl_jobs;
CREATE POLICY "Manage crawl jobs" ON public.crawl_jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage crawl pages" ON public.crawl_pages;
CREATE POLICY "Manage crawl pages" ON public.crawl_pages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage crawl links" ON public.crawl_links;
CREATE POLICY "Manage crawl links" ON public.crawl_links FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage crawl images" ON public.crawl_images;
CREATE POLICY "Manage crawl images" ON public.crawl_images FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage crawl metadata" ON public.crawl_metadata;
CREATE POLICY "Manage crawl metadata" ON public.crawl_metadata FOR ALL USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON public.crawl_jobs TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.crawl_pages TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.crawl_links TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.crawl_images TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.crawl_metadata TO authenticated, anon, service_role, postgres;
