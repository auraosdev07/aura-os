-- supabase/debug/reset_task.sql
-- Changes a selected task back to CREATED status, clearing assignments and progress for debugging.

UPDATE public.tasks
SET
  status = 'CREATED',
  assigned_agent_id = NULL,
  progress = 0,
  started_at = NULL,
  completed_at = NULL,
  updated_at = timezone('utc'::text, now())
WHERE id = 'PASTE_TASK_UUID_HERE';
