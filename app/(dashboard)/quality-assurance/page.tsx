"use client";

import React, { useState, useEffect } from "react";
import type { QAAuditReport, QAContentType } from "@/services/qa-engine/types";

export default function QualityAssuranceDashboardPage() {
  const [contentType, setContentType] = useState<QAContentType>("BLOG_ARTICLE");
  const [resourceId, setResourceId] = useState("draft_amethyst_001");
  const [title, setTitle] = useState("Amethyst Bracelet Healing Benefits & Spiritual Meaning");
  const [keyword, setKeyword] = useState("amethyst bracelet");
  const [metaTitle, setMetaTitle] = useState("Amethyst Bracelet Benefits & Meaning — Aura & Soul");
  const [metaDescription, setMetaDescription] = useState("Discover the authentic healing benefits and spiritual meaning of natural Amethyst bracelets.");
  const [slug, setSlug] = useState("amethyst-bracelet-benefits");
  const [content, setContent] = useState("Explore the profound tranquility and spiritual balance of natural Amethyst bracelets...");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<QAAuditReport | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<QAAuditReport[]>([]);

  const fetchRecentReports = async () => {
    try {
      const res = await fetch("/api/qa");
      const data = await res.json();
      if (data.reports) setRecentReports(data.reports);
    } catch (err) {
      console.error("Fetch QA reports error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const res = await fetch("/api/qa");
        const data = await res.json();
        if (isMounted && data.reports) setRecentReports(data.reports);
      } catch (err) {
        console.error("Fetch QA reports error:", err);
      }
    }
    loadInitial();
    return () => { isMounted = false; };
  }, []);

  const handleEvaluate = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const payload = {
        contentType,
        resourceId,
        title,
        content,
        keyword,
        metaTitle,
        metaDescription,
        slug,
        sections: [
          { heading: "Spiritual Healing Benefits", level: "H2", content: "Amethyst provides profound emotional calmness and spiritual alignment." },
          { heading: "Ethically Sourced Craftsmanship", level: "H2", content: "Every gemstone is 100% natural, ethically sourced, and handcrafted." },
          { heading: "Frequently Asked Questions", level: "H2", content: "Common customer queries regarding gemstone care." },
        ],
        faqs: [
          { question: "How do I cleanse my Amethyst bracelet?", answer: "Use moonlight or selenite charging plates." },
          { question: "Is this 100% natural crystal?", answer: "Yes, certified authentic natural Amethyst." },
          { question: "Can I wear it daily?", answer: "Yes, suitable for daily holistic wellness." },
        ],
        schemas: [
          { "@context": "https://schema.org", "@type": "Article", headline: title },
          { "@context": "https://schema.org", "@type": "FAQPage" },
        ],
        internalLinks: [
          { anchorText: "authentic crystal bracelets", targetUrl: "/products/amethyst-bracelet" },
        ],
      };

      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setActionMessage("✓ QA Quality Scorecard Generated Successfully!");
        fetchRecentReports();
      } else {
        setActionMessage(`❌ Evaluation Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setActionMessage(`❌ ${msg}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Quality Assurance & Publish Readiness Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Centralized Mandatory Quality Gate across Articles, Product SEO, Landing Pages, and Marketing Copy (Phase 5.4)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">Quality Gate v5.4</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* SUB-SIDEBAR EVALUATION CONTROLS */}
        <div className="col-span-4 space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Evaluation Payload Parameters</h2>

            <div className="space-y-3 bg-background border border-border p-3.5 rounded-lg text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as QAContentType)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="BLOG_ARTICLE">Blog Article</option>
                  <option value="PRODUCT_SEO_PROFILE">Product SEO Profile</option>
                  <option value="PRODUCT_DESCRIPTION">Product Description</option>
                  <option value="LANDING_PAGE">Landing Page</option>
                  <option value="MARKETING_COPY">Marketing Copy</option>
                  <option value="SUPPORT_REPLY">Customer Support Reply</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Resource ID</label>
                <input
                  type="text"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Target Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-card border border-border rounded p-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs shadow flex items-center justify-center gap-1"
              >
                {loading ? "Evaluating..." : "⚡ Execute 12 Quality Checks"}
              </button>
            </div>

            {actionMessage && (
              <div className="p-3 bg-background border border-border rounded-lg text-xs font-mono text-primary">
                {actionMessage}
              </div>
            )}
          </div>
        </div>

        {/* MAIN SCORECARD & FINDINGS DISPLAY */}
        <div className="col-span-8 space-y-6">
          {!report ? (
            <div className="min-h-[400px] bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground text-xs p-8 text-center">
              Click &quot;Execute 12 Quality Checks&quot; to run the Quality Assurance Engine and generate an explainable publish readiness scorecard.
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOP READINESS BADGE & OVERALL SCORE */}
              <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Publish Readiness Status</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`px-3 py-1 rounded text-xs font-extrabold tracking-wide uppercase ${
                        report.publishReadiness === "READY_TO_PUBLISH"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : report.publishReadiness === "NEEDS_REVIEW"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {report.publishReadiness.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      AI Pattern Footprint: <span className="font-bold text-indigo-400">{report.aiPatternProbability}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Overall Quality Score</div>
                  <div className="text-3xl font-extrabold text-emerald-400">{report.overallScore} / 100</div>
                </div>
              </div>

              {/* 12-DIMENSION SCORECARD GRID */}
              <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">12-Dimension Scorecard Breakdown</h3>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Grammar</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.grammar}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">SEO</div>
                    <div className="font-bold text-indigo-400">{report.scorecard.seo}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">EEAT & Safety</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.eeat}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Readability</div>
                    <div className="font-bold text-amber-400">{report.scorecard.readability}/100</div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Human Writing</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.humanWriting}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Brand Voice</div>
                    <div className="font-bold text-indigo-400">{report.scorecard.brandVoice}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Schema JSON-LD</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.schema}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Internal Linking</div>
                    <div className="font-bold text-amber-400">{report.scorecard.internalLinking}/100</div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Completeness</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.contentCompleteness}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">CTR Hook</div>
                    <div className="font-bold text-indigo-400">{report.scorecard.ctr}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Metadata</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.metadata}/100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">AI Pattern Score</div>
                    <div className="font-bold text-emerald-400">{report.scorecard.aiPatternDetection}/100</div>
                  </div>
                </div>
              </div>

              {/* EXPLAINABILITY: FINDINGS & RECOMMENDATIONS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-5 rounded-xl space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Explainable Audit Reasons</h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {report.reasons.map((r, idx) => (
                      <div key={idx} className="p-2.5 bg-background border border-border rounded text-xs text-foreground/90 leading-relaxed font-mono">
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-xl space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Actionable Recommendations</h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {report.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-2.5 bg-background border border-border rounded text-xs text-primary leading-relaxed font-mono">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECENT AUDIT HISTORY TIMELINE */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Quality Audit Reports</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recentReports.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-background rounded-lg border border-border">No audit reports generated.</div>
              ) : (
                recentReports.map((item, idx) => {
                  const rep = item as unknown as Record<string, unknown>;
                  return (
                    <div key={idx} className="p-3 bg-background border border-border rounded-lg text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-foreground">[{String(rep.content_type || rep.contentType)}] {String(rep.resource_id || rep.resourceId)}</div>
                        <div className="text-[10px] text-muted-foreground">Evaluated by {String(rep.evaluated_by || rep.evaluatedBy)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold">Score: {String(rep.overall_score || rep.overallScore)}/100</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">{String(rep.publish_readiness || rep.publishReadiness)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
