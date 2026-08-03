-- Migration: Init Integrations Schema
-- Description: Foundation schema for managing third-party integrations (Aura & Soul, Google, Meta, WhatsApp, etc.)

CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'General',
    description TEXT,
    icon_name VARCHAR(64) DEFAULT 'Plug',
    status VARCHAR(32) NOT NULL DEFAULT 'NOT_CONFIGURED',
    config JSONB DEFAULT '{}'::jsonb,
    last_tested_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_integrations_owner_slug ON public.integrations(owner_id, slug);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Owner RLS policies
CREATE POLICY "Users can view their own integrations"
    ON public.integrations FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own integrations"
    ON public.integrations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own integrations"
    ON public.integrations FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own integrations"
    ON public.integrations FOR DELETE
    USING (auth.uid() = owner_id);

-- Grant privileges to authenticated and service_role
GRANT ALL ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
