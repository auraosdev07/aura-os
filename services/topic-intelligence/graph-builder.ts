/**
 * services/topic-intelligence/graph-builder.ts
 *
 * Deterministic Knowledge Graph Builder (Phase 4B.3).
 * Transforms raw intelligence inputs into GraphNode[] and GraphEdge[].
 * Rules:
 *   - Same Entity -> Edge(RELATED, weight: 1.2)
 *   - Same Modifier -> Edge(MODIFIER, weight: 1.0)
 *   - Same Intent -> Edge(RELATED, weight: 0.8)
 *   - Same Product -> Edge(RELATED, weight: 1.1)
 *   - Same Material -> Edge(RELATED, weight: 1.3)
 * NO Randomness. 100% deterministic graph building.
 */

import type { GraphNode, GraphEdge, NodeType, EdgeType } from "./types";
import { classifyModifier } from "./modifier-engine";

export interface RawIntelligenceItem {
  keyword: string;
  normalizedKeyword: string;
  intent: string;
  entities: Array<{ text: string; type: string; confidence: number }>;
  suggestions: Array<{ text: string }>;
  questions: Array<{ text: string }>;
  modifiers: {
    searchModifiers?: string[];
    commercialModifiers?: string[];
    geoModifiers?: string[];
  };
}

export function buildTopicGraph(intelItems: RawIntelligenceItem[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();
  const edgeList: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const addNode = (kw: string, type: NodeType, metadata?: Record<string, any>) => {
    const key = `${kw.toLowerCase().trim()}:${type}`;
    if (!nodeMap.has(key)) {
      nodeMap.set(key, {
        keyword: kw.trim(),
        nodeType: type,
        metadata,
      });
    }
  };

  const addEdge = (src: string, tgt: string, type: EdgeType, weight: number) => {
    const s = src.trim();
    const t = tgt.trim();
    if (!s || !t || s === t) return;

    const edgeKey = `${s}->${t}:${type}`;
    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey);
      edgeList.push({
        sourceNode: s,
        targetNode: t,
        edgeType: type,
        weight: Number(weight.toFixed(2)),
      });
    }
  };

  // 1. Create Keyword Nodes & Extracted Entity/Modifier/Question Nodes
  for (const item of intelItems) {
    addNode(item.keyword, "keyword", { intent: item.intent });

    // Entities
    for (const ent of item.entities) {
      addNode(ent.text, "entity", { entityType: ent.type });
      addEdge(item.keyword, ent.text, "ENTITY", 1.3);
    }

    // Questions
    for (const q of item.questions) {
      addNode(q.text, "question");
      addEdge(item.keyword, q.text, "QUESTION", 1.1);
    }

    // Suggestions
    for (const sug of item.suggestions) {
      addNode(sug.text, "keyword");
      addEdge(item.keyword, sug.text, "CHILD", 1.0);
    }
  }

  // 2. Build Cross-Item Semantic Relationship Edges
  for (let i = 0; i < intelItems.length; i++) {
    for (let j = i + 1; j < intelItems.length; j++) {
      const itemA = intelItems[i];
      const itemB = intelItems[j];

      // Same Material Match
      const matsA = itemA.entities.filter((e) => e.type === "material").map((e) => e.text.toLowerCase());
      const matsB = itemB.entities.filter((e) => e.type === "material").map((e) => e.text.toLowerCase());
      const commonMats = matsA.filter((m) => matsB.includes(m));
      if (commonMats.length > 0) {
        addEdge(itemA.keyword, itemB.keyword, "RELATED", 1.3);
      }

      // Same Product Match
      const prodsA = itemA.entities.filter((e) => e.type === "product").map((e) => e.text.toLowerCase());
      const prodsB = itemB.entities.filter((e) => e.type === "product").map((e) => e.text.toLowerCase());
      const commonProds = prodsA.filter((p) => prodsB.includes(p));
      if (commonProds.length > 0) {
        addEdge(itemA.keyword, itemB.keyword, "RELATED", 1.1);
      }

      // Same Intent Match
      if (itemA.intent === itemB.intent && itemA.intent !== "INFORMATIONAL") {
        addEdge(itemA.keyword, itemB.keyword, "RELATED", 0.8);
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: edgeList,
  };
}
