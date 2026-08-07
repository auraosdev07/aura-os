-- Migration: 20260807000041_realtime_growth_intelligence.sql
-- Description: Creates database schema for Phase 6.1 Real-Time Intelligence Collection Engine.

-- 1. Scheduled Jobs Registry
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES public.trend_providers(id) ON DELETE CASCADE,
  cron_schedule TEXT NOT NULL DEFAULT '0 */6 * * *', -- Default every 6 hours
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'RUNNING', 'FAILED', 'DISABLED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Job Runs History
CREATE TABLE IF NOT EXISTS public.job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES public.scheduled_jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  items_processed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Trend History & Analytics
CREATE TABLE IF NOT EXISTS public.trend_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  search_volume_index INTEGER NOT NULL,
  growth_velocity REAL NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trend_history_kw ON public.trend_history(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_history_rec ON public.trend_history(recorded_at);

-- 4. Trend Alerts Log
CREATE TABLE IF NOT EXISTS public.trend_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('TREND_SPIKE', 'TREND_DROP', 'COMPETITOR_CHANGE', 'SEASONAL_OPPORTUNITY', 'KEYWORD_MOVEMENT', 'PROVIDER_FAILURE')),
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trend_alerts_type ON public.trend_alerts(type);

-- 5. Provider Health Status (Extends existing schema safely)
ALTER TABLE public.provider_health ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 120;
ALTER TABLE public.provider_health ADD COLUMN IF NOT EXISTS success_rate REAL DEFAULT 100.0;

-- 6. Trend Confidence Evaluations
CREATE TABLE IF NOT EXISTS public.trend_confidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('LOW', 'MEDIUM', 'HIGH')),
  agreeing_providers_count INTEGER NOT NULL,
  reasoning TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Real-Time Opportunity Queue
CREATE TABLE IF NOT EXISTS public.opportunity_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  target_keyword TEXT,
  business_value_score REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'QUEUED', 'ACKNOWLEDGED', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_opp_queue_status ON public.opportunity_queue(status);

-- Grant Access & Disable RLS
GRANT ALL ON TABLE public.scheduled_jobs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.job_runs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.trend_history TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.trend_alerts TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.provider_health TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.trend_confidence TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.opportunity_queue TO postgres, anon, authenticated, service_role;

ALTER TABLE public.scheduled_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_confidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_queue DISABLE ROW LEVEL SECURITY;

-- Seed Default Scheduled Jobs & Provider Health
INSERT INTO public.scheduled_jobs (id, provider_id, cron_schedule)
VALUES
  ('job_google_trends', 'google_trends', '0 */6 * * *'),
  ('job_pinterest', 'pinterest', '0 */6 * * *'),
  ('job_amazon', 'amazon', '0 */6 * * *'),
  ('job_reddit', 'reddit', '0 */6 * * *')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.provider_health (provider_id, status, latency_ms, success_rate)
VALUES
  ('google_trends', 'HEALTHY', 145, 99.5),
  ('google_autocomplete', 'HEALTHY', 95, 100.0),
  ('pinterest', 'HEALTHY', 210, 98.2),
  ('reddit', 'HEALTHY', 180, 97.8),
  ('youtube', 'HEALTHY', 160, 99.0),
  ('instagram', 'HEALTHY', 230, 96.5),
  ('amazon', 'HEALTHY', 175, 98.9),
  ('etsy', 'HEALTHY', 190, 97.4),
  ('quora', 'HEALTHY', 150, 99.1)
ON CONFLICT (provider_id) DO NOTHING;
