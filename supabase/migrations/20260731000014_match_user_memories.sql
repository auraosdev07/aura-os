-- ---------------------------------------------------------------------------
-- Migration: 20260731000014_match_user_memories.sql
-- Description: Create match_user_memories RPC function for hybrid vector & recency search.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_user_memories(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10,
  filter_owner_id uuid DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  organization_id uuid,
  type text,
  category text,
  content text,
  importance int,
  access_count int,
  last_accessed_at timestamptz,
  source_conversation_id uuid,
  similarity float,
  score float,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.owner_id,
    um.organization_id,
    um.type,
    um.category,
    um.content,
    um.importance,
    um.access_count,
    um.last_accessed_at,
    um.source_conversation_id,
    (1 - (um.embedding <=> query_embedding))::float AS similarity,
    (
      (0.45 * (1 - (um.embedding <=> query_embedding))) +
      (0.20 * exp(-0.05 * EXTRACT(EPOCH FROM (now() - um.last_accessed_at)) / 86400.0)) +
      (0.20 * (um.importance::float / 10.0)) +
      (0.15 * (ln(1 + um.access_count::float) / ln(100.0)))
    )::float AS score,
    um.created_at
  FROM public.user_memories um
  WHERE um.deleted_at IS NULL
    AND (filter_owner_id IS NULL OR um.owner_id = filter_owner_id)
    AND (filter_type IS NULL OR um.type = filter_type)
    AND (1 - (um.embedding <=> query_embedding)) >= match_threshold
  ORDER BY score DESC
  LIMIT match_count;
END;
$$;

-- Grant Execute Permissions
GRANT EXECUTE ON FUNCTION public.match_user_memories TO anon, authenticated, service_role;
