-- Migration: 20260803000023_mace_v1_engine.sql
-- Description: Creates merged_outputs table for Multi-Agent Collaboration Engine (MACE) v1.

CREATE TABLE IF NOT EXISTS public.merged_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  merged_content TEXT NOT NULL,
  child_task_ids UUID[] DEFAULT '{}',
  artifacts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_merged_outputs_parent ON public.merged_outputs(parent_task_id);

-- Enable RLS
ALTER TABLE public.merged_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Manage merged outputs" ON public.merged_outputs;
CREATE POLICY "Manage merged outputs" ON public.merged_outputs FOR ALL USING (true) WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON public.merged_outputs TO authenticated, anon, service_role, postgres;
