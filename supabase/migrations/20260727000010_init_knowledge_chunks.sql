-- ---------------------------------------------------------------------------
-- Migration: 20260727000010_init_knowledge_chunks.sql
-- Description: Create knowledge_chunks table for RAG Knowledge Indexing Foundation.
-- ---------------------------------------------------------------------------

-- 1. Enable vector extension in extensions schema if available
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Create knowledge_chunks table
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_id UUID REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES public.artifacts(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  token_count INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding extensions.vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure chunk belongs to either a knowledge entry or an artifact (or both)
  CONSTRAINT chk_chunk_source CHECK (
    knowledge_id IS NOT NULL OR artifact_id IS NOT NULL
  )
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies — Owner Isolation
CREATE POLICY "Users can view their own knowledge chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own knowledge chunks"
  ON public.knowledge_chunks FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own knowledge chunks"
  ON public.knowledge_chunks FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own knowledge chunks"
  ON public.knowledge_chunks FOR DELETE
  USING (auth.uid() = owner_id);

-- 4. Create Indexes
-- Owner filter index
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_owner
  ON public.knowledge_chunks (owner_id);

-- Foreign key lookup indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_knowledge
  ON public.knowledge_chunks (knowledge_id)
  WHERE knowledge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_artifact
  ON public.knowledge_chunks (artifact_id)
  WHERE artifact_id IS NOT NULL;

-- High-performance HNSW Cosine Index for Vector Similarity Search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
  ON public.knowledge_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
