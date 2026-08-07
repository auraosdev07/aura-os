/**
 * services/topic-intelligence/types.ts
 *
 * Types & Contracts for Phase 4B.3 SEO Knowledge Graph & Topic Intelligence Engine.
 */

export type NodeType = "keyword" | "entity" | "modifier" | "question";
export type EdgeType = "RELATED" | "CHILD" | "PARENT" | "MODIFIER" | "ENTITY" | "QUESTION";

export interface GraphNode {
  id?: string;
  keyword: string;
  nodeType: NodeType;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id?: string;
  sourceNode: string; // node keyword or id
  targetNode: string; // node keyword or id
  edgeType: EdgeType;
  weight: number;
}

export interface TopicCluster {
  id?: string;
  clusterName: string;
  primaryKeyword: string;
  intent: string;
  authorityScore: number;
  keywordCount: number;
  keywords: TopicClusterKeyword[];
}

export interface TopicClusterKeyword {
  id?: string;
  clusterId?: string;
  keyword: string;
  normalizedKeyword: string;
  relationScore: number;
  isPrimary: boolean;
}

export interface ContentGap {
  id?: string;
  keyword: string;
  clusterId?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  score: number;
}

export interface InternalLinkRecommendation {
  id?: string;
  sourceKeyword: string;
  targetKeyword: string;
  reason: string;
  score: number;
}

export interface TopicIntelligenceResult {
  clusters: TopicCluster[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  contentGaps: ContentGap[];
  internalLinks: InternalLinkRecommendation[];
  knowledgeDocId?: string;
  createdAt: string;
}
