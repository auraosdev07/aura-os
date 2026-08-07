import { NextResponse } from "next/server";
import { auditCrawl } from "@/services/seo/seo-audit-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid 'jobId' parameter" }, { status: 400 });
    }

    const report = await auditCrawl(jobId);
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to run SEO audit";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing 'jobId' query parameter" }, { status: 400 });
    }

    const report = await auditCrawl(jobId);
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch SEO audit";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
