-- Migration: 20260806000033_topic_graph.sql
-- Description: Creates tables for Phase 4B.3 SEO Knowledge Graph & Topic Intelligence Engine.

-- 1. Topic Clusters Table
CREATE TABLE IF NOT EXISTS public.topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  intent TEXT NOT NULL,
  authority_score REAL NOT NULL DEFAULT 0.0,
  keyword_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Topic Cluster Keywords Table
CREATE TABLE IF NOT EXISTS public.topic_cluster_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES public.topic_clusters(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  relation_score REAL NOT NULL DEFAULT 0.0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_topic_cluster_kw_cluster_id ON public.topic_cluster_keywords(cluster_id);
CREATE INDEX IF NOT EXISTS idx_topic_cluster_kw_norm_kw ON public.topic_cluster_keywords(normalized_keyword);

-- 3. Topic Graph Nodes Table
CREATE TABLE IF NOT EXISTS public.topic_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('keyword', 'entity', 'modifier', 'question')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_topic_graph_nodes_kw_type ON public.topic_graph_nodes(keyword, node_type);

-- 4. Topic Graph Edges Table
CREATE TABLE IF NOT EXISTS public.topic_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node UUID REFERENCES public.topic_graph_nodes(id) ON DELETE CASCADE,
  target_node UUID REFERENCES public.topic_graph_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('RELATED', 'CHILD', 'PARENT', 'MODIFIER', 'ENTITY', 'QUESTION')),
  weight REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_topic_graph_edges_src ON public.topic_graph_edges(source_node);
CREATE INDEX IF NOT EXISTS idx_topic_graph_edges_tgt ON public.topic_graph_edges(target_node);

-- 5. Content Gaps Table
CREATE TABLE IF NOT EXISTS public.content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  cluster_id UUID REFERENCES public.topic_clusters(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  reason TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_gaps_cluster ON public.content_gaps(cluster_id);

-- 6. Internal Link Recommendations Table
CREATE TABLE IF NOT EXISTS public.internal_link_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_keyword TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  reason TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Grant access & disable RLS for internal server service access
GRANT ALL ON TABLE public.topic_clusters TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.topic_cluster_keywords TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.topic_graph_nodes TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.topic_graph_edges TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.content_gaps TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.internal_link_recommendations TO postgres, anon, authenticated, service_role;

ALTER TABLE public.topic_clusters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_cluster_keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_graph_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_graph_edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_gaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_link_recommendations DISABLE ROW LEVEL SECURITY;
