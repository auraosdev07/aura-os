-- supabase/debug/force_running.sql
-- Moves a selected task status to RUNNING.

UPDATE public.tasks
SET
  status = 'RUNNING',
  started_at = COALESCE(started_at, timezone('utc'::text, now())),
  updated_at = timezone('utc'::text, now())
WHERE id = 'PASTE_TASK_UUID_HERE';
