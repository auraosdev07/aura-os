-- Migration: 20260807000040_growth_intelligence.sql
-- Description: Creates database schema for Phase 6.0 Growth Intelligence Department.

-- 1. Trend Sources / Providers Registry
CREATE TABLE IF NOT EXISTS public.trend_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., SEARCH_ENGINE, ECOMMERCE, SOCIAL, COMMUNITY
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Trend Snapshots Table
CREATE TABLE IF NOT EXISTS public.trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL REFERENCES public.trend_providers(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  search_volume_index INTEGER NOT NULL DEFAULT 50, -- Normalized 0-100 index
  growth_velocity REAL NOT NULL DEFAULT 0.0, -- Velocity rate (% increase)
  sentiment_score REAL NOT NULL DEFAULT 0.0, -- Sentiment score (-1.0 to 1.0)
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trend_snapshots_kw ON public.trend_snapshots(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_prov ON public.trend_snapshots(provider_id);

-- 3. Competitor Profiles Table
CREATE TABLE IF NOT EXISTS public.competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Gems & Jewelry',
  pricing_tier TEXT DEFAULT 'LUXURY',
  seo_authority_score REAL NOT NULL DEFAULT 50.0,
  blog_frequency_per_week REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Competitor Snapshots Table
CREATE TABLE IF NOT EXISTS public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitor_profiles(id) ON DELETE CASCADE,
  new_launches JSONB DEFAULT '[]'::jsonb,
  pricing_changes JSONB DEFAULT '[]'::jsonb,
  seo_meta_changes JSONB DEFAULT '[]'::jsonb,
  active_offers JSONB DEFAULT '[]'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_comp ON public.competitor_snapshots(competitor_id);

-- 5. Market Opportunities Table
CREATE TABLE IF NOT EXISTS public.market_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MISSING_KEYWORD', 'LOW_COMPETITION_PRODUCT', 'SEASONAL_DEMAND', 'CONTENT_GAP', 'MARKET_GAP')),
  category TEXT NOT NULL,
  target_keyword TEXT,
  business_value_score REAL NOT NULL DEFAULT 80.0, -- 0-100
  confidence_score REAL NOT NULL DEFAULT 85.0, -- 0-100
  future_potential_score REAL NOT NULL DEFAULT 90.0, -- 0-100
  reasoning TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ENQUEUED', 'DISMISSED', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_market_opps_type ON public.market_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_market_opps_status ON public.market_opportunities(status);

-- 6. Growth Scores Table
CREATE TABLE IF NOT EXISTS public.growth_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score REAL NOT NULL DEFAULT 0.0, -- 0-100
  trend_velocity_score REAL NOT NULL DEFAULT 0.0,
  competitor_gap_score REAL NOT NULL DEFAULT 0.0,
  seo_momentum_score REAL NOT NULL DEFAULT 0.0,
  product_readiness_score REAL NOT NULL DEFAULT 0.0,
  freshness_score REAL NOT NULL DEFAULT 0.0,
  explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Daily CEO Brief Table
CREATE TABLE IF NOT EXISTS public.daily_ceo_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  growth_score REAL NOT NULL,
  top_trends JSONB NOT NULL DEFAULT '[]'::jsonb,
  competitor_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Grant Access & Disable RLS for internal server operations
GRANT ALL ON TABLE public.trend_providers TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.trend_snapshots TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.competitor_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.competitor_snapshots TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.market_opportunities TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.growth_scores TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.daily_ceo_briefs TO postgres, anon, authenticated, service_role;

ALTER TABLE public.trend_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_ceo_briefs DISABLE ROW LEVEL SECURITY;

-- Seed Default Trend Providers
INSERT INTO public.trend_providers (id, name, category, is_enabled)
VALUES
  ('google_trends', 'Google Trends Adapter', 'SEARCH_ENGINE', true),
  ('google_autocomplete', 'Google Autocomplete Adapter', 'SEARCH_ENGINE', true),
  ('pinterest', 'Pinterest Visual Trends Adapter', 'SOCIAL', true),
  ('reddit', 'Reddit Community Sentiment Adapter', 'COMMUNITY', true),
  ('youtube', 'YouTube Video Search Trends Adapter', 'MEDIA', true),
  ('instagram', 'Instagram Social Engagement Adapter', 'SOCIAL', true),
  ('amazon', 'Amazon Bestseller Trends Adapter', 'ECOMMERCE', true),
  ('etsy', 'Etsy Handmade Jewelry Adapter', 'ECOMMERCE', true),
  ('quora', 'Quora Intent & Question Adapter', 'COMMUNITY', true)
ON CONFLICT (id) DO NOTHING;
