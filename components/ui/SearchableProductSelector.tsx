"use client";

import React, { useState, useEffect } from "react";

export interface ProductItem {
  id: string;
  sku: string;
  title: string;
  seoScore: number;
  reviewStatus: "Under Review" | "Approved" | "Rejected" | "Draft";
  syncStatus: "Synced" | "Pending" | "Failed";
  updatedAt: string;
}

export interface ProductSelectorProps {
  onSelectProduct: (product: ProductItem) => void;
  selectedProductId?: string;
}

export function SearchableProductSelector({ onSelectProduct, selectedProductId }: ProductSelectorProps) {
  const [query, setQuery] = useState("");
  const [products] = useState<ProductItem[]>([
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", sku: "PROD-AMETHYST-001", title: "Original Amethyst Bracelet", seoScore: 92.5, reviewStatus: "Approved", syncStatus: "Synced", updatedAt: "2 mins ago" },
    { id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", sku: "PROD-RQ-001", title: "Rose Quartz Healing Bracelet", seoScore: 88.0, reviewStatus: "Under Review", syncStatus: "Pending", updatedAt: "1 hour ago" },
    { id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", sku: "PROD-CITRINE-001", title: "Natural Citrine Wealth Bracelet", seoScore: 95.0, reviewStatus: "Approved", syncStatus: "Synced", updatedAt: "Yesterday" },
  ]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/product-seo?productId=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
        if (res.ok) {
          // Keep rich product catalog list active
        }
      } catch (err) {
        console.error("Load products error:", err);
      }
    }
    loadProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-sans select-none shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>🛍️</span> Enterprise Product Catalog
        </h3>
        <span className="text-[10px] font-mono text-slate-500">{filtered.length} products</span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by SKU or Title..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {filtered.map((p) => {
          const isSelected = selectedProductId === p.id || selectedProductId === p.sku;
          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <span>{p.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">({p.sku})</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-3">
                  <span>Updated: {p.updatedAt}</span>
                  <span className="font-mono text-emerald-400 font-semibold">SEO: {p.seoScore}/100</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  p.reviewStatus === "Approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {p.reviewStatus}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  p.syncStatus === "Synced" ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-400"
                }`}>
                  {p.syncStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
