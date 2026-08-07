-- Migration: 20260805000028_provider_priority.sql
-- Description: Adds priority_order, avg_latency_ms, last_used_at, last_error, health_score, success_rate, requests_served, failure_count columns to ai_provider_settings for dynamic registry and health engine.

ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 100;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS avg_latency_ms NUMERIC DEFAULT 0;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS success_rate NUMERIC DEFAULT 100;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS requests_served INTEGER DEFAULT 0;
ALTER TABLE public.ai_provider_settings ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0;
