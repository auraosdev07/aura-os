import { NextResponse } from "next/server";
import { crawlerService } from "@/services/crawler/crawler-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, maxDepth, maxPages } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid 'url' parameter" }, { status: 400 });
    }

    const job = await crawlerService.crawl(url, {
      maxDepth: typeof maxDepth === "number" ? maxDepth : 2,
      maxPages: typeof maxPages === "number" ? maxPages : 20,
    });

    return NextResponse.json({ success: true, job });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to start crawler job";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
