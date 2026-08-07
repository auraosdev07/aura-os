-- Migration: 20260803000021_init_task_dependencies_schema.sql
-- Description: Creates task_dependencies table for Multi-Agent Sub-Task Orchestration & Delegation.

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  child_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  created_by_agent UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  dependency_type TEXT NOT NULL DEFAULT 'REQUIRES_COMPLETION',
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_task_dep_parent ON public.task_dependencies(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dep_child ON public.task_dependencies(child_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dep_creator ON public.task_dependencies(created_by_agent);

-- Enable RLS
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Manage task dependencies" ON public.task_dependencies;
CREATE POLICY "Manage task dependencies" ON public.task_dependencies FOR ALL USING (true) WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON public.task_dependencies TO authenticated, anon, service_role, postgres;
