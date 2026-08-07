-- Migration: 20260805000025_task_outputs_schema.sql
-- Description: Creates task_outputs table for storing standardized AI execution outputs, reasoning, and deliverables.

CREATE TABLE IF NOT EXISTS public.task_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  reasoning TEXT,
  output TEXT NOT NULL,
  json_output JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_task_outputs_task ON public.task_outputs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_outputs_agent ON public.task_outputs(agent_id);

-- Enable RLS
ALTER TABLE public.task_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Manage task outputs" ON public.task_outputs;
CREATE POLICY "Manage task outputs" ON public.task_outputs FOR ALL USING (true) WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON public.task_outputs TO authenticated, anon, service_role, postgres;
