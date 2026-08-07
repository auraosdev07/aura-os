/**
 * services/topic-intelligence/orchestrator.ts
 *
 * Topic Intelligence Orchestrator for Phase 4B.3.
 * Reads `seo_keyword_intelligence` and `seo_keyword_signals` from PostgreSQL,
 * executes graph builder, cluster engine, hierarchy & internal link engines,
 * content gap engine, persists results into Phase 4B.3 database tables, and auto-saves to Knowledge Engine.
 *
 * NO LLM, NO AI Embeddings. 100% Deterministic.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type { TopicIntelligenceResult, ContentGap, InternalLinkRecommendation } from "./types";
import { buildTopicGraph, type RawIntelligenceItem } from "./graph-builder";
import { createTopicClusters } from "./cluster-engine";
import { buildParentChildHierarchy } from "./relationship-engine";
import { findContentGaps } from "./content-gap-engine";
import { generateInternalLinks } from "./internal-link-engine";
import { saveTopicIntelligenceToKnowledge } from "./topic-knowledge";

export async function generateTopicIntelligence(country: string = "IN"): Promise<TopicIntelligenceResult> {
  const { supabase } = await getServerContext();

  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase database unavailable for topic graph generation.");
  }

  // 1. Read deterministic SEO Intelligence from DB
  const { data: rows, error } = await supabase
    .from("seo_keyword_intelligence")
    .select("*")
    .eq("country", country.toUpperCase());

  if (error || !rows || rows.length === 0) {
    throw new Error(`No SEO intelligence data found for country '${country}'. Run Phase 4B.2 intelligence first.`);
  }

  const rawItems: RawIntelligenceItem[] = rows.map((r: any) => ({
    keyword: r.keyword,
    normalizedKeyword: r.normalized_keyword,
    intent: r.intent,
    entities: r.extracted_entities || [],
    suggestions: r.suggestions || [],
    questions: r.questions || [],
    modifiers: r.modifiers || {},
  }));

  // 2. Build Topic Knowledge Graph Nodes & Edges
  const { nodes, edges } = buildTopicGraph(rawItems);

  // 3. Create Deterministic Topic Clusters
  const clusters = createTopicClusters(rawItems, nodes.length, edges.length);

  // 4. Generate Content Gaps per Cluster
  const allContentGaps: ContentGap[] = [];
  for (const cluster of clusters) {
    const existingKws = cluster.keywords.map((k) => k.keyword);
    const clusterItems = rawItems.filter((i) =>
      existingKws.some((ek) => ek.toLowerCase() === i.keyword.toLowerCase())
    );

    const availableSuggestions = clusterItems.flatMap((i) => i.suggestions.map((s) => s.text));
    const communityQuestions = clusterItems.flatMap((i) => i.questions.map((q) => q.text));

    const gaps = findContentGaps(
      cluster.id || cluster.clusterName,
      cluster.primaryKeyword,
      existingKws,
      availableSuggestions,
      communityQuestions
    );
    allContentGaps.push(...gaps);
  }

  // 5. Build Parent-Child Hierarchies & Internal Link Recommendations
  const allKeywords = Array.from(
    new Set([
      ...rawItems.map((i) => i.keyword),
      ...rawItems.flatMap((i) => i.suggestions.map((s) => s.text)),
      ...rawItems.flatMap((i) => i.questions.map((q) => q.text)),
    ])
  );
  const hierarchyNodes = buildParentChildHierarchy(allKeywords);
  const internalLinks = generateInternalLinks(hierarchyNodes, "Global Topic Graph");

  const result: TopicIntelligenceResult = {
    clusters,
    nodes,
    edges,
    contentGaps: allContentGaps,
    internalLinks,
    createdAt: new Date().toISOString(),
  };

  // 6. Save to Knowledge Engine
  const knowledgeDocId = await saveTopicIntelligenceToKnowledge(result);
  result.knowledgeDocId = knowledgeDocId;

  // 7. Persist into Phase 4B.3 Database Tables
  try {
    // A. Persist Topic Clusters & Keywords
    for (const cl of clusters) {
      const { data: insertedCluster } = await supabase
        .from("topic_clusters")
        .insert({
          cluster_name: cl.clusterName,
          primary_keyword: cl.primaryKeyword,
          intent: cl.intent,
          authority_score: cl.authorityScore,
          keyword_count: cl.keywordCount,
        })
        .select("id")
        .single();

      if (insertedCluster?.id) {
        cl.id = insertedCluster.id;
        const kwRows = cl.keywords.map((k) => ({
          cluster_id: insertedCluster.id,
          keyword: k.keyword,
          normalized_keyword: k.normalizedKeyword,
          relation_score: k.relationScore,
          is_primary: k.isPrimary,
        }));
        if (kwRows.length > 0) {
          await supabase.from("topic_cluster_keywords").insert(kwRows);
        }
      }
    }

    // B. Persist Graph Nodes & Edges
    const nodeInsertRows = nodes.map((n) => ({
      keyword: n.keyword,
      node_type: n.nodeType,
      metadata: n.metadata || {},
    }));

    if (nodeInsertRows.length > 0) {
      const { data: insertedNodes } = await supabase
        .from("topic_graph_nodes")
        .upsert(nodeInsertRows, { onConflict: "keyword,node_type" })
        .select("id, keyword, node_type");

      if (insertedNodes) {
        const nodeMap = new Map<string, string>();
        for (const inode of insertedNodes) {
          nodeMap.set(inode.keyword.toLowerCase().trim(), inode.id);
        }

        const edgeInsertRows = edges
          .map((e) => {
            const srcId = nodeMap.get(e.sourceNode.toLowerCase().trim());
            const tgtId = nodeMap.get(e.targetNode.toLowerCase().trim());
            if (!srcId || !tgtId) return null;
            return {
              source_node: srcId,
              target_node: tgtId,
              edge_type: e.edgeType,
              weight: e.weight,
            };
          })
          .filter((item): item is { source_node: string; target_node: string; edge_type: any; weight: number } => item !== null);

        if (edgeInsertRows.length > 0) {
          await supabase.from("topic_graph_edges").insert(edgeInsertRows);
        }
      }
    }

    // C. Persist Content Gaps
    if (allContentGaps.length > 0) {
      const gapRows = allContentGaps.map((g) => ({
        keyword: g.keyword,
        cluster_id: clusters[0]?.id || null,
        priority: g.priority,
        reason: g.reason,
        score: g.score,
      }));
      await supabase.from("content_gaps").insert(gapRows);
    }

    // D. Persist Internal Link Recommendations
    if (internalLinks.length > 0) {
      const linkRows = internalLinks.map((l) => ({
        source_keyword: l.sourceKeyword,
        target_keyword: l.targetKeyword,
        reason: l.reason,
        score: l.score,
      }));
      await supabase.from("internal_link_recommendations").insert(linkRows);
    }
  } catch (dbErr) {
    console.error("[TOPIC ORCHESTRATOR DB PERSIST ERROR]:", dbErr);
  }

  return result;
}
