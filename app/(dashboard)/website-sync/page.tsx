"use client";

import React, { useState, useEffect } from "react";
import { ProfessionalDiffViewer } from "@/components/ui/ProfessionalDiffViewer";
import type { SyncDiffField } from "@/services/website-sync/types";

export default function WebsiteSyncDashboardPage() {
  const [resourceType, setResourceType] = useState<string>("PRODUCT");
  const [resourceId, setResourceId] = useState("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
  const [metaDescription, setMetaDescription] = useState("Updated high-converting meta description for Amethyst Bracelet.");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSyncHistory() {
      try {
        const res = await fetch("/api/website-sync/history");
        const data = await res.json();
        if (isMounted && data.history) setHistory(data.history);
      } catch (err) {
        console.error("Fetch History Error:", err);
      }
    }
    loadSyncHistory();
    return () => { isMounted = false; };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/website-sync/history");
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      console.error("Fetch History Error:", err);
    }
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/website-sync/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          updates: { seo_description: metaDescription },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        setActionMessage("✓ Side-by-Side Visual Diff Preview Generated!");
      } else {
        setActionMessage(`❌ Preview Error: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setActionMessage(`❌ ${msg}`);
    }
    setLoading(false);
  };

  const handleExecuteSync = async () => {
    setLoading(true);
    setActionMessage("Syncing content to production website...");
    try {
      const res = await fetch("/api/website-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          updates: { seo_description: metaDescription },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage("✓ Sync Executed Successfully to Production Website!");
        fetchHistory();
      } else {
        setActionMessage(`❌ SYNC BLOCKED: ${data.errorMessage}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setActionMessage(`❌ ${msg}`);
    }
    setLoading(false);
  };

  const handleRollback = async (snapshotId?: string) => {
    setActionMessage("Executing one-click rollback...");
    try {
      const res = await fetch("/api/website-sync/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType, resourceId, snapshotId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✓ Rollback Restored Previous Version (v${data.restoredVersion})!`);
        fetchHistory();
      } else {
        setActionMessage(`❌ Rollback Failed: ${data.errorMessage}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setActionMessage(`❌ ${msg}`);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground">Website Sync Adapter</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Production Website Synchronization & Snapshot Rollback Engine (Phase 5.2)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">Native OS Screen</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* SUB-SIDEBAR CONFIG PANEL */}
        <div className="col-span-4 space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Sync Parameters</h2>

            <div className="space-y-3 bg-background border border-border p-4 rounded-lg">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Resource Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="PRODUCT">Product Metadata</option>
                  <option value="BLOG">Blog Article</option>
                  <option value="SEO_METADATA">SEO Metadata Only</option>
                  <option value="SCHEMA">JSON-LD Schemas</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Resource ID / SKU</label>
                <input
                  type="text"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Proposed Update Field (`seo_description`)</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-card border border-border rounded p-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleGeneratePreview}
                  disabled={loading}
                  className="flex-1 py-2 px-2 bg-background border border-border hover:bg-background/80 text-foreground rounded font-bold text-[11px] shadow flex items-center justify-center gap-1"
                >
                  🔍 Preview Diff
                </button>
                <button
                  onClick={handleExecuteSync}
                  disabled={loading}
                  className="flex-1 py-2 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[11px] shadow flex items-center justify-center gap-1"
                >
                  ⚡ Sync Website
                </button>
              </div>
            </div>

            {actionMessage && (
              <div className="p-3 bg-background border border-border rounded-lg text-xs font-mono text-primary">
                {actionMessage}
              </div>
            )}
          </div>
        </div>

        {/* MAIN VISUAL DIFF INSPECTOR & TIMELINE */}
        <div className="col-span-8 space-y-6">
          {!preview ? (
            <div className="min-h-[260px] bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground text-xs p-8 text-center">
              Click &quot;Preview Diff&quot; to inspect visual side-by-side comparison before syncing to production website.
            </div>
          ) : (
            <ProfessionalDiffViewer
              diffs={(preview.diffs as SyncDiffField[]) || []}
              hasManualEdits={Boolean(preview.hasManualEdits)}
              warningMessage={String(preview.manualEditWarning || "")}
            />
          )}

          {/* SYNC HISTORY TIMELINE */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Sync History & Snapshot Timeline</h3>
              <button onClick={() => handleRollback()} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow">
                ⏪ 1-Click Rollback Latest Sync
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-background rounded-lg border border-border">No sync history recorded.</div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="p-3 bg-background border border-border rounded-lg text-xs flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground">
                        [{String(item.resource_type)}] {String(item.resource_id)} — <span className="text-primary">{String(item.action)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">v{String(item.previous_version)} &rarr; v{String(item.new_version)} by {String(item.synced_by)}</div>
                    </div>
                    <button onClick={() => handleRollback()} className="px-2.5 py-1 bg-card border border-border hover:bg-background text-foreground text-[10px] rounded font-semibold">
                      Restore Snapshot
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
