/**
 * services/seo-intelligence/orchestrator.ts
 *
 * Universal SEO Intelligence Layer Orchestrator (Phase 4B.2).
 * Coordinates ProviderRegistry, Raw Signal Storage, Intent Classifier, Entity Extractor,
 * Signal Miner, 7-Day Caching, and Knowledge Engine Integration.
 *
 * NO HARDCODED OR FAKE SEO METRICS.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { providerRegistry } from "./provider-registry";
import { GoogleSuggestProvider } from "./providers/google-suggest";
import { GoogleSerpPaaProvider } from "./providers/serp-paa";
import { RedditProvider } from "./providers/reddit";
import { DuckDuckGoRelatedProvider } from "./providers/duckduckgo-related";
import { QuoraProvider } from "./providers/quora";
import { CSVImportProvider } from "./providers/csv-import";

import { normalizeKeyword } from "./keyword-normalizer";
import { classifyIntent } from "./intent-classifier";
import { extractEntities } from "./entity-extractor";
import { mineSignals } from "./signal-miner";
import { saveSEOIntelligenceToKnowledge } from "./intelligence-knowledge";
import type { SEOIntelligenceReport, ProviderSignal } from "./types";
import { SEO_INTEL_CONFIG } from "./config";

// Self-register built-in providers
providerRegistry.register(new GoogleSuggestProvider());
providerRegistry.register(new GoogleSerpPaaProvider());
providerRegistry.register(new RedditProvider());
providerRegistry.register(new DuckDuckGoRelatedProvider());
providerRegistry.register(new QuoraProvider());
providerRegistry.register(new CSVImportProvider());

export async function getSEOIntelligence(
  rawKeyword: string,
  country: string = "IN",
  forceRefresh: boolean = false
): Promise<SEOIntelligenceReport> {
  const { normalized, original } = normalizeKeyword(rawKeyword);
  const targetCountry = country.toUpperCase();
  const { supabase } = await getServerContext();

  // 1. CACHE LAYER (7 Days TTL)
  if (!forceRefresh && supabase && typeof supabase.from === "function") {
    const { data: cached } = await supabase
      .from("seo_keyword_intelligence")
      .select("*")
      .eq("normalized_keyword", normalized)
      .eq("country", targetCountry)
      .maybeSingle();

    if (cached) {
      const createdAt = new Date(cached.created_at).getTime();
      const ttlMs = SEO_INTEL_CONFIG.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - createdAt < ttlMs) {
        console.log(`[SEO INTEL CACHE HIT] Keyword: "${normalized}" (${targetCountry})`);
        return {
          id: cached.id,
          keyword: cached.keyword,
          normalizedKeyword: cached.normalized_keyword,
          country: cached.country,
          intent: cached.intent,
          intentConfidence: cached.intent_confidence,
          activeProviders: cached.active_providers || [],
          totalSignalsCollected: cached.total_signals_collected || 0,
          suggestions: cached.suggestions || [],
          questions: cached.questions || [],
          relatedSearches: cached.related_searches || [],
          communityDiscussions: cached.community_discussions || [],
          serpSnapshot: cached.serp_snapshot || [],
          modifiers: cached.modifiers || {},
          extractedEntities: cached.extracted_entities || [],
          minedInsights: cached.mined_insights || {},
          knowledgeDocumentId: cached.knowledge_doc_id,
          createdAt: cached.created_at,
          updatedAt: cached.updated_at,
          isCached: true,
        };
      }
    }
  }

  console.log(`[SEO INTEL FRESH RUN] Executing Providers for "${normalized}" (${targetCountry})...`);

  // 2. RUN ALL REGISTERED PROVIDERS CONCURRENTLY
  const { signals: rawSignals, activeProviders } = await providerRegistry.runAll(normalized, targetCountry);

  // 3. INTENT, ENTITY & SIGNAL MINING
  const { intent, confidence: intentConfidence } = classifyIntent(normalized, rawSignals);
  const extractedEntities = extractEntities(normalized, rawSignals);
  const { modifiers, insights: minedInsights } = mineSignals(normalized, rawSignals);

  // Categorize signals for report structure
  const suggestions = rawSignals.filter((s) => s.type === "SUGGESTION");
  const questions = rawSignals.filter((s) => s.type === "QUESTION");
  const relatedSearches = rawSignals.filter((s) => s.type === "RELATED_SEARCH");
  const communityDiscussions = rawSignals.filter((s) => s.type === "COMMUNITY_POST");
  const serpSnapshot = rawSignals.filter((s) => s.type === "SERP_ITEM");

  let report: SEOIntelligenceReport = {
    keyword: original,
    normalizedKeyword: normalized,
    country: targetCountry,
    intent,
    intentConfidence,
    activeProviders,
    totalSignalsCollected: rawSignals.length,
    suggestions,
    questions,
    relatedSearches,
    communityDiscussions,
    serpSnapshot,
    modifiers,
    extractedEntities,
    minedInsights,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCached: false,
  };

  // 4. SAVE TO KNOWLEDGE ENGINE
  const docId = await saveSEOIntelligenceToKnowledge(report);
  report.knowledgeDocumentId = docId;

  // 5. DATABASE UPSERT & RAW SIGNAL PERMANENT STORAGE
  if (supabase && typeof supabase.from === "function") {
    try {
      const { data: upserted } = await supabase
        .from("seo_keyword_intelligence")
        .upsert(
          {
            keyword: report.keyword,
            normalized_keyword: report.normalizedKeyword,
            country: report.country,
            intent: report.intent,
            intent_confidence: report.intentConfidence,
            active_providers: report.activeProviders,
            total_signals_collected: report.totalSignalsCollected,
            suggestions: report.suggestions,
            questions: report.questions,
            related_searches: report.relatedSearches,
            community_discussions: report.communityDiscussions,
            serp_snapshot: report.serpSnapshot,
            modifiers: report.modifiers,
            extracted_entities: report.extractedEntities,
            mined_insights: report.minedInsights,
            knowledge_doc_id: report.knowledgeDocumentId || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "normalized_keyword,country" }
        )
        .select("id")
        .single();

      if (upserted?.id) {
        report.id = upserted.id;

        // RAW SIGNAL STORAGE (seo_keyword_signals)
        const signalRows = rawSignals.map((sig) => ({
          keyword_id: upserted.id,
          keyword: report.normalizedKeyword,
          provider_id: sig.sourceName.toLowerCase().replace(/\s+/g, "-"),
          provider_name: sig.sourceName,
          provider_type: sig.sourceType,
          signal_type: sig.type,
          raw_text: sig.text,
          raw_url: sig.url || null,
          metadata: sig.metadata || {},
          confidence: sig.sourceTrust || 1.0,
        }));

        if (signalRows.length > 0) {
          await supabase.from("seo_keyword_signals").insert(signalRows);
        }
      }
    } catch (dbErr) {
      console.error("[SEO INTEL DB UPSERT ERROR]:", dbErr);
    }
  }

  return report;
}
