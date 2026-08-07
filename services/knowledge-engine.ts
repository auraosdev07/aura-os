"use server";

/**
 * services/knowledge-engine.ts
 *
 * Universal Knowledge Engine Service (Phase 3.1).
 * Central brain service for Knowledge Collections, Knowledge Documents,
 * Multi-layer Search, Relevance Scoring, and Telemetry Statistics.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type {
  KnowledgeCollectionRow,
  KnowledgeDocumentRow,
  KnowledgeCollectionType,
  KnowledgeCollectionStatus,
  KnowledgeDocumentStatus,
  KnowledgeSearchFilters,
  KnowledgeSearchResult,
  KnowledgeEngineStats,
  CreateKnowledgeCollectionInput,
  CreateKnowledgeDocumentInput,
} from "@/types/knowledge-engine";

/** Helper: Estimates token count based on standard word/character ratio */
function estimateTokens(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/** Helper: Generates a lightweight string hash for content deduplication */
function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/** Helper: Cleans raw Markdown/HTML content into plain text for search */
function cleanContent(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*`_~>[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Helper: Calculates a multi-layered relevance score (0.0 to 1.0) */
function calculateRelevanceScore(
  doc: KnowledgeDocumentRow,
  queryTerms: string[],
  collection?: KnowledgeCollectionRow | null
): { score: number; snippet: string; matchedTerms: string[] } {
  if (queryTerms.length === 0) {
    return { score: 1.0, snippet: doc.summary || doc.clean_content?.slice(0, 150) || doc.title, matchedTerms: [] };
  }

  const titleLower = doc.title.toLowerCase();
  const contentLower = (doc.clean_content || doc.raw_content || "").toLowerCase();
  const summaryLower = (doc.summary || "").toLowerCase();
  const tagsLower = (doc.tags || []).map((t) => t.toLowerCase());

  let totalPoints = 0;
  const matchedTermsSet = new Set<string>();

  for (const term of queryTerms) {
    let termMatched = false;

    if (titleLower.includes(term)) {
      totalPoints += 4.0;
      termMatched = true;
    }

    if (summaryLower.includes(term)) {
      totalPoints += 2.5;
      termMatched = true;
    }

    if (tagsLower.some((t) => t.includes(term))) {
      totalPoints += 3.0;
      termMatched = true;
    }

    if (collection && (collection.name.toLowerCase().includes(term) || collection.type.toLowerCase().includes(term))) {
      totalPoints += 1.5;
      termMatched = true;
    }

    if (contentLower.includes(term)) {
      const occurrences = (contentLower.split(term).length - 1);
      totalPoints += Math.min(occurrences * 0.5, 3.0);
      termMatched = true;
    }

    if (termMatched) {
      matchedTermsSet.add(term);
    }
  }

  const maxPossiblePoints = queryTerms.length * 5.0;
  const rawScore = Math.min(1.0, totalPoints / maxPossiblePoints);
  const relevanceScore = Number(rawScore.toFixed(2));

  let snippet = doc.summary || doc.clean_content || doc.raw_content || "";
  if (snippet.length > 200) {
    const firstTerm = queryTerms.find((t) => snippet.toLowerCase().includes(t));
    if (firstTerm) {
      const index = snippet.toLowerCase().indexOf(firstTerm);
      const start = Math.max(0, index - 40);
      snippet = (start > 0 ? "..." : "") + snippet.slice(start, start + 180) + "...";
    } else {
      snippet = snippet.slice(0, 180) + "...";
    }
  }

  return {
    score: relevanceScore,
    snippet,
    matchedTerms: Array.from(matchedTermsSet),
  };
}

// ============================================================================
// KNOWLEDGE COLLECTIONS CRUD
// ============================================================================

async function resolveValidOwnerId(supabase: unknown, userId?: string | null): Promise<string | null> {
  if (!userId || userId === "00000000-0000-0000-0000-000000000000" || userId.startsWith("dev-")) return null;
  try {
    const client = supabase as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { id: string } | null }>;
          };
        };
      };
    };
    const { data } = await client.from("users").select("id").eq("id", userId).maybeSingle();
    return data ? data.id : null;
  } catch {
    return null;
  }
}

export async function createCollection(
  input: CreateKnowledgeCollectionInput
): Promise<KnowledgeCollectionRow> {
  const { supabase, user } = await getServerContext();
  const ownerId = await resolveValidOwnerId(supabase, user?.id);

  const { data, error } = await supabase
    .from("knowledge_collections")
    .insert({
      owner_id: ownerId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      status: "ACTIVE",
      tags: input.tags || [],
      metadata: input.metadata || {},
    })
    .select("*")
    .single();

  if (error) {
    console.error("[CREATE KNOWLEDGE COLLECTION ERROR]:", error);
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return data as KnowledgeCollectionRow;
}

export async function getCollections(filters?: {
  type?: KnowledgeCollectionType;
  status?: KnowledgeCollectionStatus;
  search?: string;
}): Promise<KnowledgeCollectionRow[]> {
  try {
    const { supabase } = await getServerContext();
    let query = supabase.from("knowledge_collections").select("*").order("created_at", { ascending: false });

    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) return [];
    return (data as KnowledgeCollectionRow[]) || [];
  } catch {
    return [];
  }
}

export async function getCollectionById(id: string): Promise<KnowledgeCollectionRow | null> {
  try {
    const { supabase } = await getServerContext();
    const { data, error } = await supabase
      .from("knowledge_collections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return null;
    return (data as KnowledgeCollectionRow) || null;
  } catch {
    return null;
  }
}

export async function updateCollection(
  id: string,
  updates: Record<string, unknown>
): Promise<KnowledgeCollectionRow> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = { updated_at: now };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.metadata !== undefined) payload.metadata = updates.metadata;

  const { data, error } = await supabase
    .from("knowledge_collections")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update collection: ${error.message}`);
  }

  return data as KnowledgeCollectionRow;
}

export async function deleteCollection(id: string): Promise<void> {
  const { supabase } = await getServerContext();
  const { error } = await supabase.from("knowledge_collections").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete collection: ${error.message}`);
  }
}

// ============================================================================
// KNOWLEDGE DOCUMENTS CRUD
// ============================================================================

export async function createDocument(
  input: CreateKnowledgeDocumentInput
): Promise<KnowledgeDocumentRow> {
  const { supabase, user } = await getServerContext();
  const ownerId = await resolveValidOwnerId(supabase, user?.id);

  const cleaned = input.cleanContent || cleanContent(input.rawContent);
  const tokenCount = estimateTokens(cleaned);
  const contentHash = generateSimpleHash(input.rawContent);

  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert({
      collection_id: input.collectionId || null,
      owner_id: ownerId,
      title: input.title,
      source: input.source || null,
      raw_content: input.rawContent,
      clean_content: cleaned,
      summary: input.summary || null,
      metadata: input.metadata || {},
      hash: contentHash,
      status: "PROCESSED",
      language: input.language || "en",
      tokens: tokenCount,
      tags: input.tags || [],
    })
    .select("*")
    .single();

  if (error) {
    console.error("[CREATE KNOWLEDGE DOCUMENT ERROR]:", error);
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return data as KnowledgeDocumentRow;
}

export async function getDocuments(filters?: {
  collectionId?: string;
  status?: KnowledgeDocumentStatus;
  search?: string;
  limit?: number;
}): Promise<KnowledgeDocumentRow[]> {
  try {
    const { supabase } = await getServerContext();
    let query = supabase.from("knowledge_documents").select("*").order("created_at", { ascending: false });

    if (filters?.collectionId) query = query.eq("collection_id", filters.collectionId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) return [];
    return (data as KnowledgeDocumentRow[]) || [];
  } catch {
    return [];
  }
}

export async function getDocumentById(id: string): Promise<KnowledgeDocumentRow | null> {
  try {
    const { supabase } = await getServerContext();
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return null;
    return (data as KnowledgeDocumentRow) || null;
  } catch {
    return null;
  }
}

export async function updateDocument(
  id: string,
  updates: Record<string, unknown>
): Promise<KnowledgeDocumentRow> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = { updated_at: now };

  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.source !== undefined) payload.source = updates.source;

  // Support collection_id or collectionId
  if (updates.collection_id !== undefined) payload.collection_id = updates.collection_id;
  if (updates.collectionId !== undefined) payload.collection_id = updates.collectionId;

  // Support raw_content or rawContent
  const raw = (updates.raw_content as string) || (updates.rawContent as string);
  if (raw !== undefined) {
    payload.raw_content = raw;
    payload.clean_content = cleanContent(raw);
    payload.tokens = estimateTokens(payload.clean_content as string);
    payload.hash = generateSimpleHash(raw);
  }

  if (updates.clean_content !== undefined) payload.clean_content = updates.clean_content;
  if (updates.cleanContent !== undefined) payload.clean_content = updates.cleanContent;
  if (updates.summary !== undefined) payload.summary = updates.summary;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.metadata !== undefined) payload.metadata = updates.metadata;

  const { data, error } = await supabase
    .from("knowledge_documents")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[UPDATE KNOWLEDGE DOCUMENT ERROR]:", error);
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return data as KnowledgeDocumentRow;
}

export async function deleteDocument(id: string): Promise<void> {
  const { supabase } = await getServerContext();
  const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);
  if (error) {
    console.error("[DELETE KNOWLEDGE DOCUMENT ERROR]:", error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// ============================================================================
// SEARCH LAYER & RELEVANCE SCORING
// ============================================================================

export async function searchKnowledgeEngine(
  filters: KnowledgeSearchFilters
): Promise<KnowledgeSearchResult[]> {
  try {
    const { supabase } = await getServerContext();
    const queryStr = (filters.query || "").trim();
    const queryTerms = queryStr.toLowerCase().split(/\s+/).filter(Boolean);

    let dbQuery = supabase.from("knowledge_documents").select("*");

    if (filters.collectionId) {
      dbQuery = dbQuery.eq("collection_id", filters.collectionId);
    }
    if (filters.status) {
      dbQuery = dbQuery.eq("status", filters.status);
    }

    const { data: docsData, error } = await dbQuery.order("created_at", { ascending: false }).limit(filters.limit || 50);

    if (error || !docsData || docsData.length === 0) return [];

    const collections = await getCollections();
    const collectionsMap = new Map<string, KnowledgeCollectionRow>();
    collections.forEach((c) => collectionsMap.set(c.id, c));

    const results: KnowledgeSearchResult[] = [];

    for (const doc of docsData as KnowledgeDocumentRow[]) {
      const collection = doc.collection_id ? collectionsMap.get(doc.collection_id) || null : null;

      if (filters.type && collection && collection.type !== filters.type) {
        continue;
      }

      if (filters.tags && filters.tags.length > 0) {
        const docTags = doc.tags || [];
        const matchesTag = filters.tags.some((t) => docTags.includes(t));
        if (!matchesTag) continue;
      }

      const { score, snippet, matchedTerms } = calculateRelevanceScore(doc, queryTerms, collection);

      if (queryTerms.length > 0 && score === 0) {
        continue;
      }

      results.push({
        document: doc,
        collection,
        relevanceScore: score,
        snippet,
        matchedTerms,
      });
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results;
  } catch (err) {
    console.error("[SEARCH KNOWLEDGE ENGINE ERROR]:", err);
    return [];
  }
}

// ============================================================================
// STEP 5: STATISTICS & TELEMETRY WITH FILTERS
// ============================================================================

export async function getKnowledgeEngineStats(filters?: {
  type?: KnowledgeCollectionType;
  status?: KnowledgeDocumentStatus;
  collectionId?: string;
}): Promise<KnowledgeEngineStats> {
  const defaultStats: KnowledgeEngineStats = {
    totalCollections: 0,
    totalDocuments: 0,
    totalTokens: 0,
    collectionTypeCounts: {
      WEBSITE: 0,
      PRODUCT_CATALOG: 0,
      BLOG: 0,
      DOCUMENTATION: 0,
      PDF: 0,
      MARKDOWN: 0,
      URL: 0,
      NOTES: 0,
      FAQS: 0,
      POLICIES: 0,
    },
    documentStatusCounts: {
      PENDING: 0,
      PROCESSING: 0,
      PROCESSED: 0,
      FAILED: 0,
      ARCHIVED: 0,
    },
    recentImports: [],
  };

  try {
    const [collections, docs] = await Promise.all([
      getCollections(filters?.type ? { type: filters.type } : undefined),
      getDocuments({
        collectionId: filters?.collectionId,
        status: filters?.status,
        limit: 200,
      }),
    ]);

    const collectionTypeCounts = { ...defaultStats.collectionTypeCounts };
    collections.forEach((c) => {
      if (collectionTypeCounts[c.type] !== undefined) {
        collectionTypeCounts[c.type]++;
      }
    });

    const documentStatusCounts = { ...defaultStats.documentStatusCounts };
    let totalTokens = 0;

    docs.forEach((d) => {
      totalTokens += d.tokens || 0;
      if (documentStatusCounts[d.status] !== undefined) {
        documentStatusCounts[d.status]++;
      }
    });

    return {
      totalCollections: collections.length,
      totalDocuments: docs.length,
      totalTokens,
      collectionTypeCounts,
      documentStatusCounts,
      recentImports: docs.slice(0, 5),
    };
  } catch {
    return defaultStats;
  }
}
