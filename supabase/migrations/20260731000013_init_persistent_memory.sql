-- ---------------------------------------------------------------------------
-- Migration: 20260731000013_init_persistent_memory.sql
-- Description: Create persistent memory, conversation history, and summary tables.
-- ---------------------------------------------------------------------------

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  summary TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. Create conversation_messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  token_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create conversation_summaries table
CREATE TABLE IF NOT EXISTS public.conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  start_message_id UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  end_message_id UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  summary_text TEXT NOT NULL,
  embedding extensions.vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create user_memories table
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  type TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  importance INT NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  access_count INT NOT NULL DEFAULT 1,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  embedding extensions.vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — Owner Isolation
-- conversations
CREATE POLICY "conversations_owner_select" ON public.conversations FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "conversations_owner_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "conversations_owner_update" ON public.conversations FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "conversations_owner_delete" ON public.conversations FOR DELETE USING (auth.uid() = owner_id);

-- conversation_messages (linked via conversation owner)
CREATE POLICY "messages_owner_select" ON public.conversation_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid())
);
CREATE POLICY "messages_owner_insert" ON public.conversation_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid())
);
CREATE POLICY "messages_owner_update" ON public.conversation_messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid())
);
CREATE POLICY "messages_owner_delete" ON public.conversation_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid())
);

-- conversation_summaries (linked via conversation owner)
CREATE POLICY "summaries_owner_select" ON public.conversation_summaries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid())
);
CREATE POLICY "summaries_owner_insert" ON public.conversation_summaries FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.owner_id = auth.uid())
);

-- user_memories
CREATE POLICY "user_memories_owner_select" ON public.user_memories FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "user_memories_owner_insert" ON public.user_memories FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "user_memories_owner_update" ON public.user_memories FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "user_memories_owner_delete" ON public.user_memories FOR DELETE USING (auth.uid() = owner_id);

-- 7. SQL Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversation_messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversation_summaries TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_memories TO authenticated, service_role;
GRANT SELECT ON TABLE public.conversations TO anon;
GRANT SELECT ON TABLE public.conversation_messages TO anon;
GRANT SELECT ON TABLE public.conversation_summaries TO anon;
GRANT SELECT ON TABLE public.user_memories TO anon;

-- 8. Create Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations (owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.conversation_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_summaries_conversation ON public.conversation_summaries (conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_owner ON public.user_memories (owner_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON public.user_memories (type);

-- High-Performance HNSW Cosine Index for Vector Search
CREATE INDEX IF NOT EXISTS idx_user_memories_embedding_hnsw
  ON public.user_memories
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_embedding_hnsw
  ON public.conversation_summaries
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
