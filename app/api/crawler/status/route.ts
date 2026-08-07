import { NextResponse } from "next/server";
import { crawlerService } from "@/services/crawler/crawler-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing 'jobId' query parameter" }, { status: 400 });
    }

    const job = await crawlerService.getStatus(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: "Crawl job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch crawler status";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
