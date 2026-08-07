-- Migration: 20260805000027_tool_executions.sql
-- Description: Create tool_executions table to track Tool Orchestrator execution history, retries, timeouts, and outputs.

CREATE TABLE IF NOT EXISTS public.tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    tool_id VARCHAR(100) NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, RETRYING, TIMED_OUT
    attempt_count INT NOT NULL DEFAULT 1,
    execution_time_ms INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_tool_executions_task_id ON public.tool_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_agent_id ON public.tool_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_created_at ON public.tool_executions(created_at DESC);

-- Enable RLS
ALTER TABLE public.tool_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Manage tool executions" ON public.tool_executions;
CREATE POLICY "Manage tool executions" ON public.tool_executions FOR ALL USING (true) WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON public.tool_executions TO authenticated, anon, service_role, postgres;
