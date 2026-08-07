/**
 * services/seo-intelligence/providers/reddit.ts
 *
 * Reddit Community Discussion Provider (Phase 4B.2).
 * Fetches real community discussions, user questions, and pain points via Reddit's JSON search API.
 */

import type { SEOIntelligenceProvider, ProviderSignal } from "../types";
import { SEO_INTEL_CONFIG } from "../config";
import { fetchWithRetry } from "@/services/crawler/fetch-with-retry";

export class RedditProvider implements SEOIntelligenceProvider {
  id = "reddit-community";
  name = "Reddit Community API";
  priority = 30;
  sourceType = "COMMUNITY_SERP" as const;
  trustScore = 0.85;

  async isEnabled(): Promise<boolean> {
    return true;
  }

  async collectSignals(keyword: string): Promise<ProviderSignal[]> {
    const targetUrl = `${SEO_INTEL_CONFIG.REDDIT_SEARCH_URL}${encodeURIComponent(keyword)}&limit=15&sort=relevance`;
    const timestamp = new Date().toISOString();

    const { response } = await fetchWithRetry(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraOSBot/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit JSON API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const posts = json?.data?.children || [];
    const signals: ProviderSignal[] = [];

    for (const post of posts) {
      const data = post?.data;
      if (!data || !data.title) continue;

      const title: string = data.title.trim();
      const permalink: string = data.permalink ? `https://www.reddit.com${data.permalink}` : "";
      const score: number = data.score || 0;
      const numComments: number = data.num_comments || 0;
      const subreddit: string = data.subreddit || "";
      const selftext: string = data.selftext ? data.selftext.slice(0, 300) : "";

      signals.push({
        type: "COMMUNITY_POST",
        text: title,
        url: permalink,
        metadata: {
          subreddit,
          upvotes: score,
          commentCount: numComments,
          snippet: selftext,
        },
        sourceName: this.name,
        sourceType: this.sourceType,
        sourceTrust: this.trustScore,
        sourceTimestamp: timestamp,
      });

      // If the post title is phrased as a question, also emit a QUESTION signal
      if (title.endsWith("?") || /^(how|what|why|does|can|is|where|which)/i.test(title)) {
        signals.push({
          type: "QUESTION",
          text: title,
          url: permalink,
          metadata: { source: "reddit", subreddit },
          sourceName: this.name,
          sourceType: this.sourceType,
          sourceTrust: this.trustScore,
          sourceTimestamp: timestamp,
        });
      }
    }

    return signals.slice(0, SEO_INTEL_CONFIG.MAX_COMMUNITY_POSTS);
  }
}
