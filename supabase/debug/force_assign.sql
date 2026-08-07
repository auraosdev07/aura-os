-- supabase/debug/force_assign.sql
-- Forcefully assigns a chosen task to a chosen agent (status = ASSIGNED).

UPDATE public.tasks
SET
  assigned_agent_id = 'PASTE_AGENT_UUID_HERE',
  status = 'ASSIGNED',
  updated_at = timezone('utc'::text, now())
WHERE id = 'PASTE_TASK_UUID_HERE';

INSERT INTO public.task_assignments (task_id, agent_id, role)
VALUES ('PASTE_TASK_UUID_HERE', 'PASTE_AGENT_UUID_HERE', 'PRIMARY')
ON CONFLICT DO NOTHING;
