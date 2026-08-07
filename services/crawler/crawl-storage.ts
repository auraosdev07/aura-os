/**
 * services/crawler/crawl-storage.ts
 *
 * Normalized Storage Persistence Module (Phase 4A.5).
 * Persists crawl jobs, pages, links, images, metadata, history versions, and real-time analytics.
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import type {
  CrawlJobRow,
  CrawlPageRow,
  CrawlLinkRow,
  CrawlImageRow,
  ParsedHTMLPage,
  ExtractedLink,
  ExtractedImage,
} from "./types";

export async function createCrawlJob(
  targetUrl: string,
  maxDepth = 2,
  maxPages = 20
): Promise<CrawlJobRow> {
  const { supabase, user } = await getServerContext();
  const ownerId = (user?.id && user.id !== "00000000-0000-0000-0000-000000000000" && !user.id.startsWith("dev-")) ? user.id : null;

  // 1. Fetch previous job for targetUrl to determine history version & parent_job_id
  const { data: previousJobs } = await supabase
    .from("crawl_jobs")
    .select("id, version")
    .eq("target_url", targetUrl)
    .order("version", { ascending: false })
    .limit(1);

  const parentJob = previousJobs && previousJobs.length > 0 ? previousJobs[0] : null;
  const version = parentJob ? parentJob.version + 1 : 1;
  const parentJobId = parentJob ? parentJob.id : null;

  const { data, error } = await supabase
    .from("crawl_jobs")
    .insert({
      owner_id: ownerId,
      target_url: targetUrl,
      status: "RUNNING",
      max_depth: maxDepth,
      max_pages: maxPages,
      pages_crawled: 0,
      version,
      parent_job_id: parentJobId,
      pages_per_second: 0.0,
      average_response_time_ms: 0,
      skipped_pages: 0,
      unchanged_pages: 0,
      rendered_pages: 0,
      retry_count: 0,
      duplicate_count: 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Create Crawl Job Error: ${error.message}`);
  return data as CrawlJobRow;
}

export async function updateCrawlJob(
  jobId: string,
  updates: Partial<CrawlJobRow>
): Promise<CrawlJobRow> {
  const { supabase } = await getServerContext();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("crawl_jobs")
    .update({ ...updates, updated_at: now })
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) throw new Error(`Update Crawl Job Error: ${error.message}`);
  return data as CrawlJobRow;
}

export async function findPreviousPageByUrl(
  parentJobId: string | null,
  url: string
): Promise<CrawlPageRow | null> {
  if (!parentJobId) return null;
  try {
    const { supabase } = await getServerContext();
    const { data } = await supabase
      .from("crawl_pages")
      .select("*")
      .eq("job_id", parentJobId)
      .eq("url", url)
      .maybeSingle();

    return (data as CrawlPageRow) || null;
  } catch {
    return null;
  }
}

export async function saveCrawlPage(
  jobId: string,
  page: ParsedHTMLPage
): Promise<CrawlPageRow> {
  const { supabase } = await getServerContext();

  const { data, error } = await supabase
    .from("crawl_pages")
    .insert({
      job_id: jobId,
      url: page.url,
      status_code: page.statusCode,
      final_url: page.finalUrl,
      redirect_chain: page.redirectChain,
      title: page.title,
      meta_title: page.metaTitle,
      meta_description: page.metaDescription,
      canonical: page.canonical,
      language: page.language,
      word_count: page.wordCount,
      reading_time_minutes: page.readingTimeMinutes,
      h1_tags: page.h1Tags,
      h2_tags: page.h2Tags,
      h3_tags: page.h3Tags,
      h4_tags: page.h4Tags,
      h5_tags: page.h5Tags,
      h6_tags: page.h6Tags,
      opengraph: page.openGraph,
      twitter_cards: page.twitterCards,
      json_ld: page.jsonLd,
      page_size_bytes: page.pageSizeBytes,
      content_type: page.contentType,
      response_time_ms: page.responseTimeMs,
      depth: page.depth,
      content_hash: page.contentHash,
      etag: page.etag,
      last_modified: page.lastModified,
      is_unchanged: page.isUnchanged,
      version: page.version,
      fingerprint: page.fingerprint,
      is_rendered: page.isRendered,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Save Crawl Page Error: ${error.message}`);
  return data as CrawlPageRow;
}

export async function saveCrawlLinks(
  jobId: string,
  sourcePageId: string,
  links: ExtractedLink[]
): Promise<void> {
  if (links.length === 0) return;
  const { supabase } = await getServerContext();

  const rows = links.map((l) => ({
    job_id: jobId,
    source_page_id: sourcePageId,
    target_url: l.canonicalUrl || l.targetUrl,
    anchor_text: l.anchorText || null,
    is_internal: l.isInternal,
    is_nofollow: l.isNofollow,
    is_ugc: l.isUgc,
    is_sponsored: l.isSponsored,
  }));

  const { error } = await supabase.from("crawl_links").insert(rows);
  if (error) console.error("[SAVE CRAWL LINKS ERROR]:", error.message);
}

export async function saveCrawlImages(
  jobId: string,
  pageId: string,
  images: ExtractedImage[]
): Promise<void> {
  if (images.length === 0) return;
  const { supabase } = await getServerContext();

  const rows = images.map((img) => ({
    job_id: jobId,
    page_id: pageId,
    src: img.src,
    alt_text: img.altText || null,
  }));

  const { error } = await supabase.from("crawl_images").insert(rows);
  if (error) console.error("[SAVE CRAWL IMAGES ERROR]:", error.message);
}

export async function getCrawlJobById(jobId: string): Promise<CrawlJobRow | null> {
  try {
    const { supabase } = await getServerContext();
    const { data } = await supabase
      .from("crawl_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    return (data as CrawlJobRow) || null;
  } catch {
    return null;
  }
}

export async function getCrawlResults(jobId: string): Promise<{
  job: CrawlJobRow;
  pages: CrawlPageRow[];
  links: CrawlLinkRow[];
  images: CrawlImageRow[];
}> {
  const { supabase } = await getServerContext();

  const [jobRes, pagesRes, linksRes, imagesRes] = await Promise.all([
    supabase.from("crawl_jobs").select("*").eq("id", jobId).single(),
    supabase.from("crawl_pages").select("*").eq("job_id", jobId).order("created_at", { ascending: true }),
    supabase.from("crawl_links").select("*").eq("job_id", jobId),
    supabase.from("crawl_images").select("*").eq("job_id", jobId),
  ]);

  if (jobRes.error) throw new Error(`Fetch Crawl Job Error: ${jobRes.error.message}`);

  return {
    job: jobRes.data as CrawlJobRow,
    pages: (pagesRes.data as CrawlPageRow[]) || [],
    links: (linksRes.data as CrawlLinkRow[]) || [],
    images: (imagesRes.data as CrawlImageRow[]) || [],
  };
}
