"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Image as ImageIcon, Layers, Package, AlertCircle, Radio } from "lucide-react";
import type { ProductRow, CategoryRow, CollectionRow } from "@/types/database";

// Local type — avoids importing from "use server" connector boundary
export interface StorefrontProduct extends ProductRow {
  primary_image_url?: string | null;
  category?: CategoryRow | null;
}

interface AuraSoulExplorerProps {
  initialProducts: StorefrontProduct[];
  initialCategories: CategoryRow[];
  initialCollections: CollectionRow[];
  errorMessage: string | null;
}

export function AuraSoulExplorer({
  initialProducts,
  initialCategories,
  initialCollections,
  errorMessage,
}: AuraSoulExplorerProps) {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "collections">("products");

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <Link
          href="/integrations/aura-soul"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 font-semibold mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Aura & Soul Settings</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-emerald-400" /> Aura & Soul Data Explorer
              </h1>
              {/* LIVE DATA Badge */}
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>LIVE DATA</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Read-only live schema viewer connected directly to the external Aura & Soul database.
            </p>
          </div>
        </div>
      </div>

      {/* Error Card / Connection Failed Handling */}
      {errorMessage ? (
        <div className="p-8 border border-amber-500/30 rounded-2xl bg-amber-500/5 space-y-4">
          <div className="flex items-center space-x-3 text-amber-400">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h3 className="text-base font-bold">External Database Connection Unavailable</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {errorMessage}
          </p>
          <div className="pt-2">
            <Link
              href="/integrations/aura-soul"
              className="inline-flex items-center space-x-2 text-xs px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors"
            >
              <span>Configure Connection Credentials</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("products")}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                activeTab === "products"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({initialProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("categories")}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                activeTab === "categories"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({initialCategories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("collections")}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                activeTab === "collections"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Collections ({initialCollections.length})</span>
            </button>
          </div>

          {/* Products Tab */}
          {activeTab === "products" && (
            <div>
              {initialProducts.length === 0 ? (
                <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50 text-slate-400 text-xs">
                  No active products found in the external Aura & Soul database.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900 shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3.5">Product Image & Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Inventory</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Slug</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {initialProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center text-slate-600">
                                {p.primary_image_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={p.primary_image_url}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100">{p.title}</div>
                                {p.sku && <div className="text-[11px] font-mono text-slate-500">SKU: {p.sku}</div>}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-medium text-slate-300">
                            {p.category ? p.category.name : "Uncategorized"}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                p.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-medium text-slate-300">
                            {p.stock_quantity} units
                          </td>

                          <td className="p-3.5 font-mono font-semibold text-emerald-400">
                            ${p.price.toFixed(2)}
                          </td>

                          <td className="p-3.5 font-mono text-[11px] text-slate-400">
                            /products/{p.slug}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialCategories.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-200">{c.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">/categories/{c.slug}</div>
                  {c.description && <div className="text-xs text-slate-400 pt-1">{c.description}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Collections Tab */}
          {activeTab === "collections" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialCollections.map((col) => (
                <div key={col.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-slate-200">{col.title}</div>
                  <div className="text-[11px] font-mono text-slate-500">/collections/{col.slug}</div>
                  {col.description && <div className="text-xs text-slate-400 pt-1">{col.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
