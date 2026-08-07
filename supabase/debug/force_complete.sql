-- supabase/debug/force_complete.sql
-- Marks a chosen task as COMPLETED with 100% progress.

UPDATE public.tasks
SET
  status = 'COMPLETED',
  progress = 100,
  completed_at = timezone('utc'::text, now()),
  updated_at = timezone('utc'::text, now())
WHERE id = 'PASTE_TASK_UUID_HERE';
