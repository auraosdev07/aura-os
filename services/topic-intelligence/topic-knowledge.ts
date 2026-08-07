/**
 * services/topic-intelligence/topic-knowledge.ts
 *
 * Universal Knowledge Engine Integration for Phase 4B.3.
 * Auto-saves Topic Intelligence output into "SEO Topic Intelligence" collection.
 */

import { getCollections, createCollection, createDocument } from "@/services/knowledge-engine";
import type { TopicIntelligenceResult } from "./types";

export async function saveTopicIntelligenceToKnowledge(
  result: TopicIntelligenceResult
): Promise<string | undefined> {
  try {
    const collections = await getCollections();
    let topicColl = collections.find((c) => c.name === "SEO Topic Intelligence");

    if (!topicColl) {
      topicColl = await createCollection({
        name: "SEO Topic Intelligence",
        description: "SEO Knowledge Graph nodes, edges, topic clusters, content gaps, internal linking rules, and authority telemetry.",
        type: "DOCUMENTATION",
        tags: ["seo", "topic_graph", "knowledge_graph", "clusters", "internal_linking"],
      });
    }

    const clustersSummary = result.clusters
      .map((c) => `- Cluster "${c.clusterName}" (Authority: ${c.authorityScore}/100, Keywords: ${c.keywordCount})`)
      .join("\n");

    const gapsSummary = result.contentGaps
      .slice(0, 10)
      .map((g) => `- [${g.priority}] ${g.keyword}: ${g.reason}`)
      .join("\n");

    const linksSummary = result.internalLinks
      .slice(0, 10)
      .map((l) => `- ${l.sourceKeyword} -> ${l.targetKeyword} (Score: ${l.score})`)
      .join("\n");

    const fullContent = `SEO Topic Knowledge Graph Report
Created: ${result.createdAt}
Total Topic Clusters: ${result.clusters.length}
Total Graph Nodes: ${result.nodes.length}
Total Graph Edges: ${result.edges.length}
Total Content Gaps: ${result.contentGaps.length}
Total Internal Link Recommendations: ${result.internalLinks.length}

Topic Clusters:
${clustersSummary}

Content Gaps:
${gapsSummary}

Internal Link Recommendations:
${linksSummary}`;

    const doc = await createDocument({
      collectionId: topicColl.id,
      title: `SEO Topic Graph: ${result.clusters.length} Clusters (${result.nodes.length} Nodes, ${result.edges.length} Edges)`,
      source: `topic-graph://${new Date().toISOString().slice(0, 10)}`,
      rawContent: fullContent,
      summary: `SEO Knowledge Graph contains ${result.clusters.length} topic clusters, ${result.nodes.length} nodes, ${result.edges.length} edges, ${result.contentGaps.length} content gaps, and ${result.internalLinks.length} link recommendations.`,
      tags: ["topic_graph", "clusters", `clusters_${result.clusters.length}`],
      language: "en",
    });

    return doc?.id as string | undefined;
  } catch (err) {
    console.error("[SAVE TOPIC INTELLIGENCE KNOWLEDGE ERROR]:", err);
    return undefined;
  }
}
