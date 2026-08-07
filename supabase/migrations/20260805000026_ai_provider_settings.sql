-- Migration: 20260805000026_ai_provider_settings.sql
-- Description: Creates ai_provider_settings and system_ai_config tables for AI Provider Management.

CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE, -- 'gemini' | 'openai' | 'claude'
  display_name TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key TEXT, -- Optional override; if null, reads from environment variable
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED', -- 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_provider TEXT NOT NULL DEFAULT 'gemini',
  enable_fallback BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default Gemini, OpenAI, Claude settings
INSERT INTO public.ai_provider_settings (provider, display_name, model, is_default, is_enabled, status)
VALUES
  ('gemini', 'Google Gemini (GenAI)', 'gemini-2.0-flash', true, true, 'DISCONNECTED'),
  ('openai', 'OpenAI', 'gpt-4o', false, true, 'DISCONNECTED'),
  ('claude', 'Anthropic Claude', 'claude-3-5-sonnet-20241022', false, true, 'DISCONNECTED')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO public.system_ai_config (default_provider, enable_fallback)
SELECT 'gemini', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_ai_config);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_provider_settings_default ON public.ai_provider_settings(is_default);

-- Enable RLS & Permissions
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "Manage ai_provider_settings" ON public.ai_provider_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage system_ai_config" ON public.system_ai_config;
CREATE POLICY "Manage system_ai_config" ON public.system_ai_config FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.ai_provider_settings TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.system_ai_config TO authenticated, anon, service_role, postgres;
