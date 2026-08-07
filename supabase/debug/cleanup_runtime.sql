-- supabase/debug/cleanup_runtime.sql
-- Resets all WORKING agents back to IDLE, resets all RUNNING/ASSIGNED tasks back to CREATED,
-- and cleans up orphan assignments for runtime debugging.

-- 1. Reset all WORKING/PAUSED agents to IDLE
UPDATE public.agents
SET
  status = 'IDLE',
  current_task = NULL,
  last_run = NULL,
  updated_at = timezone('utc'::text, now())
WHERE status IN ('WORKING', 'PAUSED');

-- 2. Reset all RUNNING/ASSIGNED tasks back to CREATED
UPDATE public.tasks
SET
  status = 'CREATED',
  assigned_agent_id = NULL,
  progress = 0,
  started_at = NULL,
  completed_at = NULL,
  updated_at = timezone('utc'::text, now())
WHERE status IN ('RUNNING', 'ASSIGNED', 'WAITING');

-- 3. Delete orphan task assignments where task is no longer assigned
DELETE FROM public.task_assignments
WHERE task_id IN (
  SELECT id FROM public.tasks WHERE status = 'CREATED'
);
