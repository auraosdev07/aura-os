/**
 * services/search/types.ts
 *
 * Search Provider Abstraction Layer Interfaces (Phase 4A Step 8).
 * Defines pluggable SearchProvider contract for future search engine implementations
 * (Google, Brave, SerpAPI, Tavily, Firecrawl, Bing, DuckDuckGo).
 */

export interface SearchQuery {
  query: string;
  limit?: number;
  country?: string;
  language?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  totalResults?: number;
  providerName: string;
}

export interface RelatedSearch {
  query: string;
}

export interface SuggestResult {
  suggestions: string[];
}

export interface NewsResultItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
}

export interface SearchProvider {
  name: string;
  search(params: SearchQuery): Promise<SearchResponse>;
  related(query: string): Promise<RelatedSearch[]>;
  suggest(query: string): Promise<SuggestResult>;
  news(query: string): Promise<NewsResultItem[]>;
}
