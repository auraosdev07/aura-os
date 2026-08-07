-- Migration: 20260806000035_ai_writer.sql
-- Description: Creates database tables for Phase 4B.5A Universal AI Writer Engine.

-- 1. Main Article Drafts Table
CREATE TABLE IF NOT EXISTS public.article_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  provider TEXT NOT NULL DEFAULT 'heuristic-mock',
  model TEXT NOT NULL DEFAULT 'default',
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  slug TEXT NOT NULL,
  introduction TEXT NOT NULL,
  summary TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  validation_score REAL NOT NULL DEFAULT 0.0,
  knowledge_doc_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_article_drafts_kw_country ON public.article_drafts(normalized_keyword, country);
CREATE INDEX IF NOT EXISTS idx_article_drafts_version ON public.article_drafts(version);

-- 2. Article Sections Table
CREATE TABLE IF NOT EXISTS public.article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('H1', 'H2', 'H3', 'H4')),
  content TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_article_sections_draft ON public.article_sections(draft_id);

-- 3. Article Metadata Table
CREATE TABLE IF NOT EXISTS public.article_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  og_title TEXT,
  og_description TEXT,
  twitter_description TEXT,
  schema_json JSONB DEFAULT '[]'::jsonb,
  cta_json JSONB DEFAULT '{}'::jsonb,
  faq_json JSONB DEFAULT '[]'::jsonb,
  references_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Article Images Plan Table
CREATE TABLE IF NOT EXISTS public.article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  prompt TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL,
  placement TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Article Internal Links Table
CREATE TABLE IF NOT EXISTS public.article_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  placement_section TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Article Validation Reports Table
CREATE TABLE IF NOT EXISTS public.article_validation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  validation_score REAL NOT NULL DEFAULT 0.0,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  checks_passed JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Grant Access and Disable RLS for Internal Server Access
GRANT ALL ON TABLE public.article_drafts TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.article_sections TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.article_metadata TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.article_images TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.article_internal_links TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.article_validation_reports TO postgres, anon, authenticated, service_role;

ALTER TABLE public.article_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_internal_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_validation_reports DISABLE ROW LEVEL SECURITY;
