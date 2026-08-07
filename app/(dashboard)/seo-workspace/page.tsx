"use client";

import React, { useState } from "react";

export default function SEOWorkspacePage() {
  const [keyword, setKeyword] = useState("rose quartz bracelet");
  const [country, setCountry] = useState("IN");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<"intel" | "graph" | "brief" | "writer" | "knowledge" | "json" | "logs">("intel");
  const [loading, setLoading] = useState(false);

  // Results & Logs State
  const [intelResult, setIntelResult] = useState<any>(null);
  const [graphResult, setGraphResult] = useState<any>(null);
  const [briefResult, setBriefResult] = useState<any>(null);
  const [writerResult, setWriterResult] = useState<any>(null);
  const [rawJson, setRawJson] = useState<any>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: "info" | "warn" | "error"; message: string }>>([]);
  const [timings, setTimings] = useState<{ total: number; intel: number; graph: number; brief: number; writer: number }>({
    total: 0,
    intel: 0,
    graph: 0,
    brief: 0,
    writer: 0,
  });

  const addLog = (level: "info" | "warn" | "error", message: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), level, message }]);
  };

  const handleRunPipeline = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setLogs([]);
    setIntelResult(null);
    setGraphResult(null);
    setBriefResult(null);
    setRawJson(null);

    const startTotal = Date.now();
    addLog("info", `Starting SEO Pipeline for "${keyword}" (${country}) [ForceRefresh: ${forceRefresh}]`);

    let currentIntel: any = null;
    let currentGraph: any = null;
    let currentBrief: any = null;
    let currentWriter: any = null;

    // 1. STAGE 1: SEO INTELLIGENCE
    const t0 = Date.now();
    addLog("info", "Executing Stage 1: SEO Intelligence...");
    try {
      const res = await fetch("/api/seo/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, country, forceRefresh }),
      });
      const data = await res.json();
      const elapsed = Date.now() - t0;
      setTimings((prev) => ({ ...prev, intel: elapsed }));

      if (!res.ok || data.error) {
        addLog("error", `Stage 1 Failed (${elapsed}ms): ${data.error || res.statusText}`);
      } else {
        currentIntel = data.report;
        setIntelResult(data.report);
        addLog("info", `Stage 1 Success (${elapsed}ms): Collected ${data.report.totalSignalsCollected} signals across ${data.report.activeProviders.length} providers. Cached: ${data.report.isCached}`);
      }
    } catch (err: any) {
      addLog("error", `Stage 1 Network Error: ${err.message}`);
    }

    // 2. STAGE 2: TOPIC INTELLIGENCE GRAPH
    const t1 = Date.now();
    addLog("info", "Executing Stage 2: Topic Intelligence Graph...");
    try {
      const res = await fetch("/api/topic-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      const elapsed = Date.now() - t1;
      setTimings((prev) => ({ ...prev, graph: elapsed }));

      if (!res.ok || data.error) {
        addLog("error", `Stage 2 Failed (${elapsed}ms): ${data.error || res.statusText}`);
      } else {
        currentGraph = data.result;
        setGraphResult(data.result);
        addLog("info", `Stage 2 Success (${elapsed}ms): Generated ${data.result.clusters.length} clusters, ${data.result.nodes.length} nodes, ${data.result.edges.length} edges.`);
      }
    } catch (err: any) {
      addLog("error", `Stage 2 Network Error: ${err.message}`);
    }

    // 3. STAGE 3: CONTENT STRATEGY BRIEF
    const t2 = Date.now();
    addLog("info", "Executing Stage 3: Content Strategy Brief...");
    try {
      const res = await fetch("/api/content-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, country, forceRefresh }),
      });
      const data = await res.json();
      const elapsed = Date.now() - t2;
      setTimings((prev) => ({ ...prev, brief: elapsed }));

      if (!res.ok || data.error) {
        addLog("error", `Stage 3 Failed (${elapsed}ms): ${data.error || res.statusText}`);
      } else {
        currentBrief = data.brief;
        setBriefResult(data.brief);
        addLog("info", `Stage 3 Success (${elapsed}ms): Content Type '${data.brief.recommendedContentType}', Word Count: ${data.brief.recommendedWordCount}, Score: ${data.brief.briefScore}/100.`);
      }
    } catch (err: any) {
      addLog("error", `Stage 3 Network Error: ${err.message}`);
    }

    // 4. STAGE 4: AI WRITER ENGINE
    const t3 = Date.now();
    addLog("info", "Executing Stage 4: Universal AI Writer Engine...");
    try {
      const res = await fetch("/api/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, country, forceRefresh }),
      });
      const data = await res.json();
      const elapsed = Date.now() - t3;
      setTimings((prev) => ({ ...prev, writer: elapsed }));

      if (!res.ok || data.error) {
        addLog("error", `Stage 4 Failed (${elapsed}ms): ${data.error || res.statusText}`);
      } else {
        currentWriter = data;
        setWriterResult(data);
        addLog("info", `Stage 4 Success (${elapsed}ms): Draft Title '${data.draft.title}' (${data.draft.wordCount} words), Score: ${data.qualityScore}/100.`);
      }
    } catch (err: any) {
      addLog("error", `Stage 4 Network Error: ${err.message}`);
    }

    const totalElapsed = Date.now() - startTotal;
    setTimings((prev) => ({ ...prev, total: totalElapsed }));

    setRawJson({
      seoIntelligence: currentIntel,
      topicGraph: currentGraph,
      contentBrief: currentBrief,
      aiWriterResult: currentWriter,
    });

    addLog("info", `Pipeline Completed in ${totalElapsed}ms.`);
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* LEFT SIDEBAR CONTROL PANEL */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg mb-1">
              <span className="p-1 bg-indigo-500/20 rounded">⚡</span> SEO Workspace
            </div>
            <p className="text-xs text-slate-400">Internal Developer Console (Phase 4B Pipeline)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Keyword Query</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. rose quartz bracelet"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="forceRefresh"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-0"
              />
              <label htmlFor="forceRefresh" className="text-xs text-slate-300 cursor-pointer">
                Bypass Cache (Force Refresh)
              </label>
            </div>

            <button
              onClick={handleRunPipeline}
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                  Running Pipeline...
                </>
              ) : (
                <>🚀 Run All Pipeline</>
              )}
            </button>
          </div>
        </div>

        {/* TELEMETRY FOOTER */}
        <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs space-y-1.5">
          <div className="text-slate-400 font-semibold mb-1">Execution Telemetry</div>
          <div className="flex justify-between text-slate-300">
            <span>Total Duration:</span>
            <span className="font-mono text-indigo-400">{timings.total}ms</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>SEO Intelligence:</span>
            <span className="font-mono">{timings.intel}ms</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Topic Graph:</span>
            <span className="font-mono">{timings.graph}ms</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Content Strategy:</span>
            <span className="font-mono">{timings.brief}ms</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP TAB BAR */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <nav className="flex gap-2">
            {[
              { id: "intel", label: "SEO Intelligence" },
              { id: "graph", label: "Topic Graph" },
              { id: "brief", label: "Content Brief" },
              { id: "writer", label: "AI Writer Draft" },
              { id: "knowledge", label: "Knowledge Docs" },
              { id: "json", label: "Raw JSON" },
              { id: "logs", label: `Logs (${logs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* TAB PANELS */}
        <section className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {/* TAB 1: SEO INTELLIGENCE */}
          {activeTab === "intel" && (
            <div className="space-y-6">
              {!intelResult ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/50 border border-slate-800/80 rounded">
                  No SEO Intelligence generated yet. Click "Run All Pipeline" to execute.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Search Intent</div>
                      <div className="text-lg font-bold text-indigo-400">{intelResult.intent}</div>
                      <div className="text-xs text-slate-500 mt-1">Confidence: {intelResult.intentConfidence}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Total Signals</div>
                      <div className="text-lg font-bold text-emerald-400">{intelResult.totalSignalsCollected}</div>
                      <div className="text-xs text-slate-500 mt-1">From {intelResult.activeProviders.length} Providers</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Cache Status</div>
                      <div className="text-lg font-bold text-amber-400">{intelResult.isCached ? "CACHED" : "FRESH RUN"}</div>
                      <div className="text-xs text-slate-500 mt-1">7-Day TTL Active</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Knowledge Doc</div>
                      <div className="text-xs font-mono text-slate-300 truncate mt-2">{intelResult.knowledgeDocumentId || "N/A"}</div>
                    </div>
                  </div>

                  {/* Extracted Entities */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Extracted Entities</h3>
                    <div className="flex flex-wrap gap-2">
                      {intelResult.extractedEntities.map((e: any, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-xs rounded text-indigo-300 font-mono">
                          [{e.type.toUpperCase()}] {e.text} ({e.confidence})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions & Questions Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
                      <h3 className="text-sm font-bold text-slate-200">Suggestions ({intelResult.suggestions.length})</h3>
                      <ul className="text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto">
                        {intelResult.suggestions.map((s: any, i: number) => (
                          <li key={i} className="p-1.5 bg-slate-950/60 rounded border border-slate-800/60">• {s.text}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
                      <h3 className="text-sm font-bold text-slate-200">Questions ({intelResult.questions.length})</h3>
                      <ul className="text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto">
                        {intelResult.questions.map((q: any, i: number) => (
                          <li key={i} className="p-1.5 bg-slate-950/60 rounded border border-slate-800/60">• {q.text}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOPIC GRAPH */}
          {activeTab === "graph" && (
            <div className="space-y-6">
              {!graphResult ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/50 border border-slate-800/80 rounded">
                  No Topic Graph generated yet. Click "Run All Pipeline" to execute.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Graph Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Topic Clusters</div>
                      <div className="text-lg font-bold text-indigo-400">{graphResult.clusters.length}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Graph Nodes</div>
                      <div className="text-lg font-bold text-emerald-400">{graphResult.nodes.length}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Graph Edges</div>
                      <div className="text-lg font-bold text-amber-400">{graphResult.edges.length}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Content Gaps</div>
                      <div className="text-lg font-bold text-rose-400">{graphResult.contentGaps.length}</div>
                    </div>
                  </div>

                  {/* Clusters List */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                    <h3 className="text-sm font-bold text-slate-200">Topic Clusters & Authority Scores</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {graphResult.clusters.map((c: any, i: number) => (
                        <div key={i} className="bg-slate-950 border border-slate-800 p-3.5 rounded space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-indigo-300">{c.clusterName}</span>
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs font-mono">
                              Auth: {c.authorityScore}/100
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">Primary: {c.primaryKeyword} | Keywords: {c.keywordCount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Gaps & Internal Links */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Discovered Content Gaps</h3>
                      <ul className="text-xs text-slate-300 space-y-2">
                        {graphResult.contentGaps.map((g: any, i: number) => (
                          <li key={i} className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                            <span>{g.keyword}</span>
                            <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold">{g.priority}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Internal Link Recommendations</h3>
                      <ul className="text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto">
                        {graphResult.internalLinks.slice(0, 8).map((l: any, i: number) => (
                          <li key={i} className="p-2 bg-slate-950 rounded border border-slate-800 space-y-1">
                            <div className="font-mono text-indigo-300 text-[11px]">{l.sourceKeyword} → {l.targetKeyword}</div>
                            <div className="text-[10px] text-slate-400">{l.reason}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTENT BRIEF */}
          {activeTab === "brief" && (
            <div className="space-y-6">
              {!briefResult ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/50 border border-slate-800/80 rounded">
                  No Content Brief generated yet. Click "Run All Pipeline" to execute.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Content Type</div>
                      <div className="text-lg font-bold text-indigo-400">{briefResult.recommendedContentType}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Target Word Count</div>
                      <div className="text-lg font-bold text-emerald-400">{briefResult.recommendedWordCount} words</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Brief Quality Score</div>
                      <div className="text-lg font-bold text-amber-400">{briefResult.briefScore} / 100</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Recommended Schemas</div>
                      <div className="text-xs font-mono text-indigo-300 mt-2">{briefResult.recommendedSchema.join(", ")}</div>
                    </div>
                  </div>

                  {/* Title Recommendations */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                    <h3 className="text-sm font-bold text-slate-200">Title Recommendations (6 Options)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {briefResult.titleIdeas.map((t: any, i: number) => (
                        <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
                          <div className="text-[10px] text-indigo-400 font-bold uppercase">{t.type}</div>
                          <div className="text-xs font-semibold text-slate-200">{t.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ & CTA Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">FAQ Structure (With Answer Placeholders)</h3>
                      <ul className="text-xs text-slate-300 space-y-2">
                        {briefResult.faqList.map((f: any, i: number) => (
                          <li key={i} className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                            <div className="font-semibold text-slate-200">Q: {f.question}</div>
                            <div className="text-[10px] text-slate-500 font-mono italic">{f.answerPlaceholder}</div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 mb-2">CTA Strategy</h3>
                        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded space-y-1">
                          <div className="text-xs font-bold text-indigo-400">{briefResult.ctaRecommendation.ctaType}</div>
                          <div className="text-xs font-semibold text-slate-200">{briefResult.ctaRecommendation.heading}</div>
                          <div className="text-xs text-slate-400">{briefResult.ctaRecommendation.description}</div>
                          <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded text-[11px] font-bold">
                            {briefResult.ctaRecommendation.buttonText}
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-200 mb-2">Product Placement Points</h3>
                        <ul className="text-xs text-slate-300 space-y-1.5">
                          {briefResult.productPlacements.map((p: any, i: number) => (
                            <li key={i} className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                              <span className="font-semibold text-slate-300">{p.placementLocation}</span>
                              <span className="text-slate-500 text-[11px]">{p.suggestedProductTypes.join(", ")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AI WRITER DRAFT */}
          {activeTab === "writer" && (
            <div className="space-y-6">
              {!writerResult ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/50 border border-slate-800/80 rounded">
                  No AI Article Draft generated yet. Click "Run All Pipeline" to execute.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Stats Bar */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Draft Version & Provider</div>
                      <div className="text-lg font-bold text-indigo-400">v{writerResult.draft?.version || 1} ({writerResult.draft?.provider || "Heuristic"})</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Total Word Count</div>
                      <div className="text-lg font-bold text-emerald-400">{writerResult.draft?.wordCount || 0} words</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">Quality Score</div>
                      <div className="text-lg font-bold text-amber-400">{writerResult.qualityScore ?? writerResult.validationReport?.validationScore ?? 0} / 100</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="text-xs text-slate-400">URL Slug</div>
                      <div className="text-xs font-mono text-indigo-300 truncate mt-2">/articles/{writerResult.metadata?.slug || writerResult.draft?.slug}</div>
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
                    <h3 className="text-sm font-bold text-slate-200">Article Title & Metadata</h3>
                    <div className="text-base font-bold text-indigo-300">{writerResult.metadata?.title || writerResult.draft?.title}</div>
                    <div className="text-xs text-slate-400">Meta Title: <span className="text-slate-200">{writerResult.metadata?.metaTitle || writerResult.draft?.metaTitle}</span></div>
                    <div className="text-xs text-slate-400">Meta Description: <span className="text-slate-200">{writerResult.metadata?.metaDescription || writerResult.draft?.metaDescription}</span></div>
                  </div>

                  {/* Validation Report Section */}
                  {writerResult.validationReport && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200">Validation Report</h3>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${writerResult.validationReport.isValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {writerResult.validationReport.isValid ? "PASSED VALIDATION" : "VALIDATION FAILED"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                          <div className="font-semibold text-emerald-400">Checks Passed ({writerResult.validationReport.checksPassed?.length || 0})</div>
                          <ul className="space-y-0.5 text-slate-300">
                            {(writerResult.validationReport.checksPassed || []).map((c: string, idx: number) => (
                              <li key={idx}>✓ {c}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                          <div className="font-semibold text-amber-400">Warnings / Errors ({writerResult.validationReport.errors?.length || 0})</div>
                          {writerResult.validationReport.errors?.length === 0 ? (
                            <div className="text-slate-500 italic">Zero errors reported</div>
                          ) : (
                            <ul className="space-y-0.5 text-rose-300">
                              {(writerResult.validationReport.errors || []).map((e: string, idx: number) => (
                                <li key={idx}>✗ {e}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Article Body Sections */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                    <h3 className="text-sm font-bold text-slate-200">Article Introduction & Body Sections ({writerResult.draft?.sections?.length || 0})</h3>
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                      {writerResult.draft?.introduction}
                    </div>
                    <div className="space-y-3">
                      {(writerResult.draft?.sections || []).map((sec: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                          <div className="text-xs font-bold text-indigo-400">[{sec.level}] {sec.heading}</div>
                          <div className="text-xs text-slate-300 leading-relaxed">{sec.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ & Schema Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Final FAQ Answers ({(writerResult.faq || []).length})</h3>
                      <ul className="text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto">
                        {(writerResult.faq || []).map((f: any, idx: number) => (
                          <li key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                            <div className="font-semibold text-slate-200">Q: {f.question}</div>
                            <div className="text-slate-400">{f.answer}</div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">JSON-LD Schemas ({(writerResult.schema || []).length})</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(writerResult.schema || []).map((s: string, idx: number) => (
                          <pre key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto">
                            {s}
                          </pre>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Plan & Internal Links Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Image Prompts & Alt Texts ({(writerResult.imagePlan || []).length})</h3>
                      <ul className="text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto">
                        {(writerResult.imagePlan || []).map((img: any, idx: number) => (
                          <li key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                            <div className="font-bold text-indigo-400">{img.heading} ({img.placement})</div>
                            <div className="text-[11px] text-slate-400 font-mono">Prompt: "{img.prompt}"</div>
                            <div className="text-[10px] text-slate-500">Alt Text: {img.altText}</div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Internal Link Placements ({(writerResult.internalLinks || []).length})</h3>
                      <ul className="text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto">
                        {(writerResult.internalLinks || []).slice(0, 10).map((l: any, idx: number) => (
                          <li key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                            <div className="font-semibold text-slate-200">"{l.anchorText}" → <span className="font-mono text-indigo-300 text-[11px]">{l.destinationUrl}</span></div>
                            <div className="text-[10px] text-slate-500">Section: {l.placementSection}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KNOWLEDGE DOCUMENTS */}
          {activeTab === "knowledge" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Universal Knowledge Engine Registrations</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">SEO Intelligence Document</div>
                      <div className="text-[11px] font-mono text-slate-500">{intelResult?.knowledgeDocumentId || "Not generated"}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">PERSISTED</span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">SEO Topic Intelligence Document</div>
                      <div className="text-[11px] font-mono text-slate-500">{graphResult?.knowledgeDocId || "Not generated"}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">PERSISTED</span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">SEO Content Brief Document</div>
                      <div className="text-[11px] font-mono text-slate-500">{briefResult?.knowledgeDocId || "Not generated"}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">PERSISTED</span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">AI Writer Draft Document</div>
                      <div className="text-[11px] font-mono text-slate-500">{writerResult?.knowledgeDocument || writerResult?.draft?.knowledgeDocId || "Not generated"}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold">PERSISTED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RAW JSON */}
          {activeTab === "json" && (
            <div className="h-full">
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-emerald-400 overflow-auto max-h-[calc(100vh-160px)]">
                {rawJson ? JSON.stringify(rawJson, null, 2) : "// No API payload output yet."}
              </pre>
            </div>
          )}

          {/* TAB 6: LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded">
                  No execution logs recorded yet.
                </div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded border text-xs font-mono flex items-start gap-3 ${
                      log.level === "error"
                        ? "bg-rose-950/40 border-rose-800/80 text-rose-300"
                        : log.level === "warn"
                        ? "bg-amber-950/40 border-amber-800/80 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
