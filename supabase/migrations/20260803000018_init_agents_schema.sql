-- Migration: 20260803000018_init_agents_schema.sql
-- Description: Creates agents, agent_tools, agent_memory, and agent_activity tables with RLS and permissions for Agent Runtime Foundation.

CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'WORKING', 'PAUSED', 'ERROR')),
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  memory_scope TEXT NOT NULL DEFAULT 'private' CHECK (memory_scope IN ('private', 'shared')),
  connected_integrations JSONB DEFAULT '[]'::jsonb,
  enabled_tools JSONB DEFAULT '[]'::jsonb,
  current_task TEXT,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  tool_type TEXT NOT NULL DEFAULT 'builtin',
  config JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'private' CHECK (scope IN ('private', 'shared')),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('STARTED', 'FINISHED', 'FAILED', 'WAITING', 'PAUSED')),
  duration_ms BIGINT DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own agents"
  ON public.agents FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can manage tools of their own agents"
  ON public.agent_tools FOR ALL
  USING (agent_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid()))
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage memory of their own agents or shared memory"
  ON public.agent_memory FOR ALL
  USING (owner_id = auth.uid() OR scope = 'shared')
  WITH CHECK (owner_id = auth.uid() OR scope = 'shared');

CREATE POLICY "Users can manage activity of their own agents"
  ON public.agent_activity FOR ALL
  USING (agent_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid()))
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE owner_id = auth.uid()));

-- Permissions
GRANT ALL ON public.agents TO authenticated, anon, service_role;
GRANT ALL ON public.agent_tools TO authenticated, anon, service_role;
GRANT ALL ON public.agent_memory TO authenticated, anon, service_role;
GRANT ALL ON public.agent_activity TO authenticated, anon, service_role;
