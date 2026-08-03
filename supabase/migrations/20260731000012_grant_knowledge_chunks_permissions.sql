-- ---------------------------------------------------------------------------
-- Migration: 20260731000012_grant_knowledge_chunks_permissions.sql
-- Description: Grant permissions for knowledge_chunks table and RPC to authenticated users.
-- ---------------------------------------------------------------------------

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Table Permissions on knowledge_chunks
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.knowledge_chunks TO authenticated, service_role;
GRANT SELECT ON TABLE public.knowledge_chunks TO anon;

-- 3. Grant Execute Permissions on match_knowledge_chunks function
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks TO anon, authenticated, service_role;
