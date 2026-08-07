-- Migration: 20260805000024_acp_v1_protocol.sql
-- Description: Creates agent_threads, agent_messages, and agent_message_attachments tables for Agent Communication Protocol (ACP) v1.

CREATE TABLE IF NOT EXISTS public.agent_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.agent_threads(id) ON DELETE CASCADE NOT NULL,
  sender_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  recipient_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'DIRECT' CHECK (message_type IN ('DIRECT', 'BROADCAST', 'REQUEST_INFO', 'RESPONSE_INFO')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'RESOLVED')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.agent_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.agent_messages(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  attachment_type TEXT DEFAULT 'DATA' CHECK (attachment_type IN ('DATA', 'ARTIFACT', 'TASK_LINK')),
  content_or_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_agent_threads_creator ON public.agent_threads(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_threads_task ON public.agent_threads(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_thread ON public.agent_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON public.agent_messages(sender_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON public.agent_messages(recipient_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON public.agent_messages(status);

-- Enable RLS
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Manage agent threads" ON public.agent_threads;
CREATE POLICY "Manage agent threads" ON public.agent_threads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage agent messages" ON public.agent_messages;
CREATE POLICY "Manage agent messages" ON public.agent_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage agent message attachments" ON public.agent_message_attachments;
CREATE POLICY "Manage agent message attachments" ON public.agent_message_attachments FOR ALL USING (true) WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON public.agent_threads TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.agent_messages TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.agent_message_attachments TO authenticated, anon, service_role, postgres;
