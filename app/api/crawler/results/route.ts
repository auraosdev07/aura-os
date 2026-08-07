import { NextResponse } from "next/server";
import { crawlerService } from "@/services/crawler/crawler-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing 'jobId' query parameter" }, { status: 400 });
    }

    const results = await crawlerService.getResults(jobId);
    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch crawler results";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
