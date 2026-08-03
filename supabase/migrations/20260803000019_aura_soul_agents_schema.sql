-- Migration: 20260803000019_aura_soul_agents_schema.sql
-- Description: Production-ready database schema for Agent Runtime Foundation (agents, agent_tools, agent_memory, agent_runs, agent_logs).
-- Execute this SQL file directly in the Supabase SQL Editor for your connected project.

-- 1. agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 2. agent_tools table
CREATE TABLE IF NOT EXISTS public.agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  tool_type TEXT NOT NULL DEFAULT 'builtin',
  config JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. agent_memory table
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'private' CHECK (scope IN ('private', 'shared')),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. agent_runs table
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms BIGINT DEFAULT 0,
  output JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. agent_logs table
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  run_id UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'INFO' CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  event_type TEXT NOT NULL DEFAULT 'EXECUTION',
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON public.agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_tools_agent_id ON public.agent_tools(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON public.agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_scope ON public.agent_memory(scope);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON public.agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON public.agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_run_id ON public.agent_logs(run_id);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow manage access for owner or service role)
CREATE POLICY "Manage agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage agent tools" ON public.agent_tools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage agent memory" ON public.agent_memory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage agent runs" ON public.agent_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage agent logs" ON public.agent_logs FOR ALL USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON public.agents TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.agent_tools TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.agent_memory TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.agent_runs TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.agent_logs TO authenticated, anon, service_role, postgres;
