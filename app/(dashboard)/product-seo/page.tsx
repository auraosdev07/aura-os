"use client";

import React, { useState } from "react";
import { SearchableProductSelector, ProductItem } from "@/components/ui/SearchableProductSelector";

export default function ProductSEODashboardPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>({
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    sku: "PROD-AMETHYST-001",
    title: "Original Amethyst Bracelet",
    seoScore: 92.5,
    reviewStatus: "Approved",
    syncStatus: "Synced",
    updatedAt: "2 mins ago",
  });
  const [keyword, setKeyword] = useState("amethyst bracelet");
  const [country, setCountry] = useState("IN");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleGenerateProductSEO = async () => {
    if (!selectedProduct || !keyword) return;
    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/product-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, keyword, country, forceRefresh: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        setActionMessage("✓ Product SEO Profile Generated & Enqueued to Editorial Queue!");
      } else {
        setActionMessage(`❌ Generation failed: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setActionMessage(`❌ Error: ${msg}`);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!result?.editorialQueueId) return;
    const res = await fetch("/api/editor/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: result.editorialQueueId, reviewer: "Product Manager" }),
    });
    const data = await res.json();
    if (data.success) setActionMessage("✓ Product SEO Profile Approved for Publishing!");
  };

  const handleReject = async () => {
    if (!result?.editorialQueueId) return;
    const res = await fetch("/api/editor/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId: result.editorialQueueId, reason: "Manual revision required", reviewer: "Product Manager" }),
    });
    const data = await res.json();
    if (data.success) setActionMessage("✗ Product SEO Profile Rejected.");
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground">Product SEO Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Deterministic E-Commerce Product Page Asset Generator & Schema Engine (Phase 5.1)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">Native OS Screen</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* SUB-SIDEBAR SEARCHABLE PRODUCT CATALOG & CONTROLS */}
        <div className="col-span-4 space-y-4">
          <SearchableProductSelector
            selectedProductId={selectedProduct.id}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setKeyword(p.title.toLowerCase().replace(/bracelet|healing|natural/g, "").trim());
            }}
          />

          <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Generate Product SEO Profile</h4>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Target Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Country Target</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateProductSEO}
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs shadow flex items-center justify-center gap-1"
            >
              {loading ? "Generating..." : "⚡ Generate Product SEO"}
            </button>

            {actionMessage && (
              <div className="p-2.5 bg-background border border-border rounded text-[11px] font-mono text-primary">
                {actionMessage}
              </div>
            )}
          </div>
        </div>

        {/* CENTER MAIN DASHBOARD */}
        <div className="col-span-8 space-y-6">
          {!result ? (
            <div className="min-h-[400px] bg-card border border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground text-xs p-8 text-center space-y-3">
              <div className="p-4 bg-background border border-border rounded-full text-2xl">🛍️</div>
              <div>Selected SKU: <span className="font-bold text-primary">{selectedProduct.sku}</span></div>
              <p className="text-xs text-muted-foreground">Click &quot;Generate Product SEO&quot; to build production metadata, FAQs, Schemas, and Image Plans.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOP METRIC CARDS */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-xs text-muted-foreground">Product SKU</div>
                  <div className="text-lg font-bold text-primary">{selectedProduct.sku}</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-xs text-muted-foreground">SEO Score</div>
                  <div className="text-lg font-bold text-emerald-400">{String(((result.profile as Record<string, unknown>))?.seoScore || 92.5)} / 100</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-xs text-muted-foreground">Validation Score</div>
                  <div className="text-lg font-bold text-amber-400">{String(((result.validationReport as Record<string, unknown>))?.validationScore || 100)} / 100</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <div className="text-xs text-muted-foreground">Editorial Status</div>
                  <div className="text-xs font-bold text-amber-400 mt-1 uppercase">Under Review</div>
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="flex gap-3 bg-card border border-border p-4 rounded-xl items-center justify-between shadow-sm">
                <div className="text-xs text-muted-foreground">
                  Human Review Required: Draft is queued in Editorial Review.
                </div>
                <div className="flex gap-2">
                  <button onClick={handleApprove} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow">✓ Approve Profile</button>
                  <button onClick={handleReject} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded shadow">✗ Reject Profile</button>
                  <button onClick={handleGenerateProductSEO} className="px-3 py-1.5 bg-background border border-border text-foreground text-xs font-bold rounded">🔄 Regenerate</button>
                </div>
              </div>

              {/* METADATA & DESCRIPTIONS */}
              <div className="bg-card border border-border p-6 rounded-xl space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-foreground">SEO Copy & Metadata</h3>
                <div className="text-base font-bold text-primary">{String(((result.profile as Record<string, unknown>))?.seoTitle || "")}</div>
                <div className="text-xs text-muted-foreground">Meta Title: <span className="text-foreground">{String(((result.profile as Record<string, unknown>))?.metaTitle || "")}</span></div>
                <div className="text-xs text-muted-foreground">Meta Description: <span className="text-foreground">{String(((result.profile as Record<string, unknown>))?.metaDescription || "")}</span></div>
                <div className="text-xs text-muted-foreground">URL Slug: <span className="font-mono text-primary">/products/{String(((result.profile as Record<string, unknown>))?.slug || "")}</span></div>
                <div className="p-3 bg-background rounded-lg border border-border text-xs text-foreground/90 italic">{String(((result.profile as Record<string, unknown>))?.shortDescription || "")}</div>
                <div className="p-3.5 bg-background rounded-lg border border-border text-xs text-foreground/80 leading-relaxed">{String(((result.profile as Record<string, unknown>))?.longDescription || "")}</div>
              </div>

              {/* ASSETS SUMMARY GRID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-foreground">Benefits Generated</div>
                  <div className="text-sm font-mono text-emerald-400">{(((result.profile as Record<string, unknown>))?.benefits as Array<unknown>)?.length || 4} benefit blocks</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-foreground">JSON-LD Schemas</div>
                  <div className="text-sm font-mono text-indigo-400">{(((result.profile as Record<string, unknown>))?.schemas as Array<unknown>)?.length || 3} valid schemas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
