-- Migration: 20260803000020_init_tasks_schema.sql
-- Description: Creates tasks, task_assignments, task_events, and task_artifacts tables for Task Orchestrator Foundation.

-- 1. tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'QUEUED', 'ASSIGNED', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  requested_by TEXT NOT NULL DEFAULT 'OWNER',
  due_date TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_duration TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. task_assignments table
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'PRIMARY',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. task_events table
CREATE TABLE IF NOT EXISTS public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. task_artifacts table
CREATE TABLE IF NOT EXISTS public.task_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artifact_type TEXT NOT NULL DEFAULT 'document',
  content_or_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent_id ON public.tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_agent_id ON public.task_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON public.task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_artifacts_task_id ON public.task_artifacts(task_id);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Manage tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage task assignments" ON public.task_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage task events" ON public.task_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage task artifacts" ON public.task_artifacts FOR ALL USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON public.tasks TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.task_assignments TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.task_events TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.task_artifacts TO authenticated, anon, service_role, postgres;
