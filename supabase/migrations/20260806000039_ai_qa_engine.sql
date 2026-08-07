-- Migration: 20260806000039_ai_qa_engine.sql
-- Description: Creates public.qa_audit_reports table for Phase 5.4 AI Quality Assurance Engine.

CREATE TABLE IF NOT EXISTS public.qa_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- e.g. BLOG_ARTICLE, PRODUCT_SEO_PROFILE, PRODUCT_DESCRIPTION, LANDING_PAGE
  resource_id TEXT NOT NULL,
  overall_score REAL NOT NULL,
  publish_readiness TEXT NOT NULL CHECK (publish_readiness IN ('READY_TO_PUBLISH', 'NEEDS_REVIEW', 'REJECT')),
  ai_pattern_probability TEXT NOT NULL CHECK (ai_pattern_probability IN ('LOW', 'MEDIUM', 'HIGH')),
  scorecard JSONB NOT NULL DEFAULT '{}'::jsonb,
  validator_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluated_by TEXT NOT NULL DEFAULT 'Aura OS QA Engine v5.4',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_qa_audit_reports_res ON public.qa_audit_reports(resource_id);
CREATE INDEX IF NOT EXISTS idx_qa_audit_reports_type ON public.qa_audit_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_qa_audit_reports_readiness ON public.qa_audit_reports(publish_readiness);

GRANT ALL ON TABLE public.qa_audit_reports TO postgres, anon, authenticated, service_role;
ALTER TABLE public.qa_audit_reports DISABLE ROW LEVEL SECURITY;
