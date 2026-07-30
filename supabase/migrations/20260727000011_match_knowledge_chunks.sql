-- ---------------------------------------------------------------------------
-- Migration: 20260727000011_match_knowledge_chunks.sql
-- Description: Create match_knowledge_chunks RPC function for vector similarity search.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_threshold FLOAT DEFAULT 0.0,
  match_count INT DEFAULT 10,
  filter_owner_id UUID DEFAULT NULL,
  filter_layer TEXT DEFAULT NULL,
  filter_mission_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  knowledge_id UUID,
  artifact_id UUID,
  chunk_index INT,
  content TEXT,
  token_count INT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.owner_id,
    kc.knowledge_id,
    kc.artifact_id,
    kc.chunk_index,
    kc.content,
    kc.token_count,
    kc.metadata,
    (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.knowledge_chunks kc
  WHERE (filter_owner_id IS NULL OR kc.owner_id = filter_owner_id)
    AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
    AND (filter_layer IS NULL OR kc.metadata->>'layer' = filter_layer)
    AND (filter_mission_id IS NULL OR (kc.metadata->>'missionId')::UUID = filter_mission_id)
  ORDER BY kc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
