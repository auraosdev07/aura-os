/**
 * services/topic-intelligence/cluster-engine.ts
 *
 * Deterministic Topic Clustering Engine (Phase 4B.3).
 * Groups intelligence keywords into topic clusters based on shared entities, products, materials, and intents.
 * NO AI, NO Randomness. 100% deterministic grouping.
 */

import type { TopicCluster, TopicClusterKeyword } from "./types";
import type { RawIntelligenceItem } from "./graph-builder";
import { calculateTopicAuthority } from "./topic-authority";

export function createTopicClusters(
  items: RawIntelligenceItem[],
  totalGraphNodes: number,
  totalGraphEdges: number
): TopicCluster[] {
  const clusterMap = new Map<string, RawIntelligenceItem[]>();

  // 1. Group items by Primary Material or Product entity
  for (const item of items) {
    const matEntity = item.entities.find((e) => e.type === "material")?.text;
    const prodEntity = item.entities.find((e) => e.type === "product")?.text;

    const clusterKey = matEntity
      ? `${matEntity.toLowerCase()} ${prodEntity || "products"}`
      : item.keyword.toLowerCase().trim();

    if (!clusterMap.has(clusterKey)) {
      clusterMap.set(clusterKey, []);
    }
    clusterMap.get(clusterKey)!.push(item);
  }

  const resultClusters: TopicCluster[] = [];

  // 2. Build TopicCluster objects
  for (const [clusterKey, groupItems] of clusterMap.entries()) {
    const primaryItem = groupItems[0];
    const clusterName = clusterKey.replace(/\b\w/g, (l) => l.toUpperCase());

    const keywords: TopicClusterKeyword[] = [];
    const seenKw = new Set<string>();

    for (const item of groupItems) {
      if (!seenKw.has(item.normalizedKeyword)) {
        seenKw.add(item.normalizedKeyword);
        keywords.push({
          keyword: item.keyword,
          normalizedKeyword: item.normalizedKeyword,
          relationScore: item.keyword === primaryItem.keyword ? 1.0 : 0.85,
          isPrimary: item.keyword === primaryItem.keyword,
        });
      }

      // Add child suggestions to cluster
      for (const sug of item.suggestions.slice(0, 5)) {
        const normSug = sug.text.toLowerCase().trim();
        if (!seenKw.has(normSug)) {
          seenKw.add(normSug);
          keywords.push({
            keyword: sug.text,
            normalizedKeyword: normSug,
            relationScore: 0.70,
            isPrimary: false,
          });
        }
      }
    }

    const questionCount = groupItems.reduce((acc, i) => acc + i.questions.length, 0);

    const authorityScore = calculateTopicAuthority({
      keywordCount: keywords.length,
      totalEdges: totalGraphEdges,
      totalNodes: totalGraphNodes,
      questionCount,
      serpCount: groupItems.length,
      communityCount: groupItems.length,
    });

    resultClusters.push({
      clusterName,
      primaryKeyword: primaryItem.keyword,
      intent: primaryItem.intent,
      authorityScore,
      keywordCount: keywords.length,
      keywords,
    });
  }

  // Deterministically sort clusters by authority score descending
  return resultClusters.sort((a, b) => b.authorityScore - a.authorityScore);
}
