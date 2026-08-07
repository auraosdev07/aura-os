-- 20260806000032_seo_intelligence_layer.sql
-- Universal SEO Intelligence Layer (Phase 4B.2)

-- 1. Main table for normalized keyword intelligence
CREATE TABLE IF NOT EXISTS public.seo_keyword_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  
  -- Intent & Confidence
  intent TEXT NOT NULL,
  intent_confidence REAL NOT NULL,
  
  -- Telemetry & Provider execution tracking
  active_providers JSONB DEFAULT '[]',
  total_signals_collected INT DEFAULT 0,
  
  -- Normalized Signals
  suggestions JSONB DEFAULT '[]',
  questions JSONB DEFAULT '[]',
  related_searches JSONB DEFAULT '[]',
  community_discussions JSONB DEFAULT '[]',
  serp_snapshot JSONB DEFAULT '[]',
  
  -- Mined Insights & Entities
  modifiers JSONB DEFAULT '{}',
  extracted_entities JSONB DEFAULT '[]',
  mined_insights JSONB DEFAULT '{}',
  
  knowledge_doc_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_intel_keyword_country
  ON public.seo_keyword_intelligence(normalized_keyword, country);
CREATE INDEX IF NOT EXISTS idx_seo_intel_intent ON public.seo_keyword_intelligence(intent);

-- 2. Raw Signal Storage Table (Permanent source of truth prior to normalization)
CREATE TABLE IF NOT EXISTS public.seo_keyword_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES public.seo_keyword_intelligence(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  raw_url TEXT,
  metadata JSONB DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_signals_keyword_id ON public.seo_keyword_signals(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_signals_provider ON public.seo_keyword_signals(provider_id);

-- 3. Provider Health & Telemetry Table
CREATE TABLE IF NOT EXISTS public.provider_health (
  provider_id TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL,
  last_run TIMESTAMPTZ NOT NULL DEFAULT now(),
  success_count INT NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  success_rate REAL NOT NULL DEFAULT 1.0,
  average_response_ms REAL NOT NULL DEFAULT 0.0,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, DEGRADED, DISABLED, BLOCKED
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions and RLS policies
GRANT ALL ON TABLE public.seo_keyword_intelligence TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.seo_keyword_signals TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.provider_health TO postgres, anon, authenticated, service_role;

ALTER TABLE public.seo_keyword_intelligence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keyword_signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health DISABLE ROW LEVEL SECURITY;
