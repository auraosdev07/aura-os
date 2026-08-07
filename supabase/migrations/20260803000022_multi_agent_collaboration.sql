-- Migration: 20260803000022_multi_agent_collaboration.sql
-- Description: Creates task_subtasks table for multi-agent subtask planning, execution ordering, and dependency management.

CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  child_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  execution_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent ON public.task_subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_child ON public.task_subtasks(child_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_dep ON public.task_subtasks(dependency_task_id);

-- Enable RLS
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Manage task subtasks" ON public.task_subtasks;
CREATE POLICY "Manage task subtasks" ON public.task_subtasks FOR ALL USING (true) WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON public.task_subtasks TO authenticated, anon, service_role, postgres;
