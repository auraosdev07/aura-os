-- Migration: 20260806000034_content_strategy.sql
-- Description: Creates content_briefs and content_brief_sections tables for Phase 4B.4 SEO Content Strategy Engine.

-- 1. Main Content Briefs Table
CREATE TABLE IF NOT EXISTS public.content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  cluster_id UUID REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  intent TEXT NOT NULL,
  recommended_content_type TEXT NOT NULL,
  recommended_word_count INTEGER NOT NULL DEFAULT 1500,
  recommended_schema JSONB DEFAULT '[]'::jsonb,
  brief_score REAL NOT NULL DEFAULT 0.0,
  knowledge_doc_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_briefs_kw_country
  ON public.content_briefs(normalized_keyword, country);
CREATE INDEX IF NOT EXISTS idx_content_briefs_cluster ON public.content_briefs(cluster_id);

-- 2. Content Brief Sections Table (Stores structured breakdown per section)
CREATE TABLE IF NOT EXISTS public.content_brief_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.content_brief_sections(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- TITLE_IDEAS, HEADINGS, FAQS, ENTITIES, SEMANTIC_KEYWORDS, INTERNAL_LINKS, CTA, PRODUCT_PLACEMENT, MISSING_TOPICS, CONVERSION_OPPORTUNITIES
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_brief_sections_brief_id ON public.content_brief_sections(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_sections_type ON public.content_brief_sections(section_type);

-- Grant access & disable RLS for service access
GRANT ALL ON TABLE public.content_briefs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.content_brief_sections TO postgres, anon, authenticated, service_role;

ALTER TABLE public.content_briefs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_brief_sections DISABLE ROW LEVEL SECURITY;
