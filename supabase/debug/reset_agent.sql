-- supabase/debug/reset_agent.sql
-- Resets a selected agent back to IDLE status for debugging/testing.

UPDATE public.agents
SET 
  status = 'IDLE',
  current_task = NULL,
  last_run = NULL,
  updated_at = timezone('utc'::text, now())
WHERE id = 'PASTE_AGENT_UUID_HERE' OR name ILIKE '%SEO%';
