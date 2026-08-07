-- Migration: 20260806000029_universal_knowledge_engine.sql
-- Description: Creates knowledge_collections and knowledge_documents tables for Phase 3.1 Universal Knowledge Engine.

-- 1. Create knowledge_collections table
CREATE TABLE IF NOT EXISTS public.knowledge_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'DOCUMENTATION' CHECK (type IN (
    'WEBSITE', 'PRODUCT_CATALOG', 'BLOG', 'DOCUMENTATION', 'PDF', 'MARKDOWN', 'URL', 'NOTES', 'FAQS', 'POLICIES'
  )),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PROCESSING', 'SYNCING', 'ARCHIVED', 'ERROR')),
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create knowledge_documents table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.knowledge_collections(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT,
  raw_content TEXT NOT NULL,
  clean_content TEXT,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  hash TEXT,
  status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'ARCHIVED')),
  language TEXT NOT NULL DEFAULT 'en',
  tokens INTEGER NOT NULL DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_owner ON public.knowledge_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_type ON public.knowledge_collections(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_status ON public.knowledge_collections(status);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_collection ON public.knowledge_documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_owner ON public.knowledge_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_hash ON public.knowledge_documents(hash);

-- Enable RLS
ALTER TABLE public.knowledge_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Manage knowledge collections" ON public.knowledge_collections;
CREATE POLICY "Manage knowledge collections" ON public.knowledge_collections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Manage knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Manage knowledge documents" ON public.knowledge_documents FOR ALL USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON public.knowledge_collections TO authenticated, anon, service_role, postgres;
GRANT ALL ON public.knowledge_documents TO authenticated, anon, service_role, postgres;
