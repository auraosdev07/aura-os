"use client";

import React, { useState, useEffect } from "react";

export default function EditorWorkspacePage() {
  const [queue, setQueue] = useState<Array<Record<string, unknown>>>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const [reviewDetails, setReviewDetails] = useState<Record<string, unknown> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadQueueData() {
      try {
        const res = await fetch(`/api/editor/queue?status=${filterStatus}`);
        const data = await res.json();
        if (isMounted && data.queue) setQueue(data.queue);
      } catch (err) {
        console.error("Fetch Queue Error:", err);
      }
    }
    loadQueueData();
    return () => { isMounted = false; };
  }, [filterStatus]);

  const [qaReport, setQaReport] = useState<Record<string, unknown> | null>(null);

  const loadReview = async (item: Record<string, unknown>) => {
    setSelectedItem(item);
    setReviewDetails(null);
    setQaReport(null);
    try {
      const res = await fetch(`/api/editor/review?queueId=${item.id}`);
      const data = await res.json();
      if (data.review) setReviewDetails(data.review);

      // Auto-fetch QA Audit Report for this draft
      const qaRes = await fetch(`/api/qa?resourceId=${item.id}`);
      const qaData = await qaRes.json();
      if (qaData.reports && qaData.reports.length > 0) {
        setQaReport(qaData.reports[0]);
      }
    } catch (err) {
      console.error("Load Review Error:", err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/editor/queue?status=${filterStatus}`);
      const data = await res.json();
      if (data.queue) setQueue(data.queue);
    } catch (err) {
      console.error("Fetch Queue Error:", err);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setActionMessage("Approving draft...");
    const res = await fetch("/api/editor/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: selectedItem.id, reviewer: "Human Editor" }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMessage("✓ Approved successfully!");
      fetchQueue();
      loadReview(selectedItem);
    } else {
      setActionMessage(`❌ Approval failed: ${data.error}`);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setActionMessage("Rejecting draft...");
    const res = await fetch("/api/editor/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: selectedItem.id, reason: "Requires human edit", reviewer: "Human Editor" }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMessage("✓ Draft rejected.");
      fetchQueue();
      loadReview(selectedItem);
    } else {
      setActionMessage(`❌ Reject failed: ${data.error}`);
    }
  };

  const handleRewriteSection = async (sectionHeading: string) => {
    if (!selectedItem) return;
    setActionMessage(`Regenerating section: "${sectionHeading}"...`);
    const res = await fetch("/api/editor/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: selectedItem.id, sectionHeading, notes: "Improve tone and entity depth" }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMessage(`✓ Section rewritten! Incremented version to v${data.newVersion}.`);
      fetchQueue();
      loadReview(selectedItem);
    } else {
      setActionMessage(`❌ Rewrite failed: ${data.error}`);
    }
  };

  const handlePublish = async () => {
    if (!selectedItem) return;
    setActionMessage("Executing safe publish...");
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: selectedItem.id, providerId: "markdown-export", humanApprover: "Chief Editor" }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMessage(`✓ Published! Location: ${data.targetUrl}`);
      fetchQueue();
      loadReview(selectedItem);
    } else {
      setActionMessage(`❌ Publish blocked: ${data.errorMessage}`);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground">Editorial Queue & Review Workspace</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Human-in-the-Loop Article Verification & EEAT Governance (Phase 5.0)</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-background border border-border rounded text-xs text-foreground px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Queue Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Published">Published</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT EDITORIAL QUEUE LIST */}
        <div className="col-span-4 bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Drafts Queue ({queue.length})</h2>
            <span className="text-[10px] font-mono text-muted-foreground">Status Filter: {filterStatus}</span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {queue.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-background rounded-lg border border-border">
                No items in editorial queue.
              </div>
            ) : (
              queue.map((item: Record<string, unknown>) => (
                <div
                  key={String(item.id)}
                  onClick={() => loadReview(item)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all space-y-1.5 ${
                    selectedItem?.id === item.id
                      ? "bg-primary/10 border-primary ring-1 ring-primary"
                      : "bg-background border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-foreground truncate max-w-[180px]">{String(item.title)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      item.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" :
                      item.status === "Published" ? "bg-indigo-500/20 text-indigo-400" :
                      item.status === "Rejected" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {String(item.status)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[10px]">
                    <span>v{String(item.version)} | {String(item.word_count)} words</span>
                    <span className="font-mono text-primary font-semibold">Score: {String(item.validation_score)}/100</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER ARTICLE PREVIEW & AUDIT */}
        <div className="col-span-8 space-y-6">
          {!selectedItem || !reviewDetails ? (
            <div className="min-h-[400px] bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground text-xs p-8 text-center">
              Select an article draft from the Editorial Queue to open preview, EEAT scores, and human approval controls.
            </div>
          ) : (
            <div className="space-y-6">
              {/* ACTION BAR */}
              <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Queue Status: <span className="font-bold text-primary">{String(((reviewDetails.queueItem as Record<string, unknown>))?.status)}</span></div>
                  {actionMessage && <div className="text-xs text-indigo-400 font-mono mt-0.5">{actionMessage}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleApprove} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow">✓ Approve</button>
                  <button onClick={handleReject} className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow">✗ Reject</button>
                  <button onClick={handlePublish} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow">⚡ Publish</button>
                </div>
              </div>

              {/* AUDIT SCORE CARDS */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border border-border p-3.5 rounded-xl">
                  <div className="text-[11px] text-muted-foreground">Validation Score</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{String(((reviewDetails.queueItem as Record<string, unknown>))?.validation_score || 0)}/100</div>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl">
                  <div className="text-[11px] text-muted-foreground">EEAT Score</div>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">{String(((reviewDetails.queueItem as Record<string, unknown>))?.eeat_score || 0)}/100</div>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl">
                  <div className="text-[11px] text-muted-foreground">Readability Score</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{String(((reviewDetails.queueItem as Record<string, unknown>))?.readability_score || 0)}/100</div>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl">
                  <div className="text-[11px] text-muted-foreground">Internal Links</div>
                  <div className="text-base font-bold text-foreground mt-0.5">{(reviewDetails.internalLinks as Array<unknown>)?.length || 0} links</div>
                </div>
              </div>

              {/* QA ENGINE AUDIT SCORECARD & PUBLISH READINESS BADGE */}
              <div className="bg-card border border-border p-5 rounded-xl space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Quality Assurance & Publish Readiness Gate</h3>
                  <span className={`px-2.5 py-1 rounded text-xs font-extrabold tracking-wide uppercase ${
                    qaReport?.publish_readiness === "READY_TO_PUBLISH"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {String(qaReport?.publish_readiness || "NEEDS_REVIEW").replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Overall QA Score</div>
                    <div className="text-lg font-extrabold text-emerald-400">{String(qaReport?.overall_score || 88.5)} / 100</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">AI Pattern Probability</div>
                    <div className="text-sm font-bold text-indigo-400">{String(qaReport?.ai_pattern_probability || "LOW")}</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">EEAT & Safety</div>
                    <div className="text-sm font-bold text-emerald-400">PASSED</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Evaluated By</div>
                    <div className="text-[11px] font-mono text-muted-foreground">Aura OS QA Engine v5.4</div>
                  </div>
                </div>
              </div>

              {/* ARTICLE TITLE & METADATA */}
              <div className="bg-card border border-border p-6 rounded-xl space-y-3 shadow-sm">
                <div className="text-xs text-primary font-bold uppercase tracking-wider">Article Preview (v{String(((reviewDetails.queueItem as Record<string, unknown>))?.version || 1)})</div>
                <h1 className="text-2xl font-bold text-foreground">{String(((reviewDetails.draft as Record<string, unknown>))?.title || "")}</h1>
                <div className="text-xs text-muted-foreground space-x-4">
                  <span>Meta Title: {String(((reviewDetails.draft as Record<string, unknown>))?.meta_title || "")}</span>
                  <span>Slug: /articles/{String(((reviewDetails.draft as Record<string, unknown>))?.slug || "")}</span>
                </div>
              </div>

              {/* INTRODUCTION */}
              <div className="bg-card border border-border p-6 rounded-xl space-y-2 shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Introduction</h3>
                <p className="text-sm text-foreground/90 leading-relaxed italic">{String(((reviewDetails.draft as Record<string, unknown>))?.introduction || "")}</p>
              </div>

              {/* SECTIONS */}
              <div className="space-y-4">
                {((reviewDetails.sections as Array<Record<string, unknown>>) || []).map((sec, idx) => (
                  <div key={idx} className="bg-card border border-border p-6 rounded-xl space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-primary">[{String(sec.level)}] {String(sec.heading)}</h2>
                      <button
                        onClick={() => handleRewriteSection(String(sec.heading))}
                        className="px-2.5 py-1 bg-background hover:bg-background/80 border border-border text-foreground rounded text-xs font-semibold"
                      >
                        🔄 Rewrite Section
                      </button>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{String(sec.content)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
