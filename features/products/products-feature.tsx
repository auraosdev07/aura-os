"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Package, RefreshCw, Radio, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ProductTable } from "./product-table";
import { ProductForm } from "./product-form";
import {
  fetchProductsService,
  fetchCategoriesService,
  fetchCollectionsService,
  fetchFullProductByIdService,
  saveProductService,
  deleteProductService,
  createQuickCategoryService,
  type FullProductDetails,
  type SaveProductPayload,
  type ProductView,
} from "@/services/product";
import type { CategoryRow, CollectionRow } from "@/types/database";

export function ProductsFeature() {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editProductDetails, setEditProductDetails] = useState<FullProductDetails | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const [prods, cats, cols] = await Promise.all([
        fetchProductsService({
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
        }),
        fetchCategoriesService(),
        fetchCollectionsService(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCollections(cols);
    } catch (err: unknown) {
      setConnectionError((err as Error).message || "Failed to connect to Aura & Soul database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setConnectionError(null);
      try {
        const [prods, cats, cols] = await Promise.all([
          fetchProductsService({
            search: search.trim() || undefined,
            status: statusFilter || undefined,
            categoryId: categoryFilter || undefined,
          }),
          fetchCategoriesService(),
          fetchCollectionsService(),
        ]);
        if (!ignore) {
          setProducts(prods);
          setCategories(cats);
          setCollections(cols);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setConnectionError((err as Error).message || "Failed to connect to Aura & Soul database.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [search, statusFilter, categoryFilter]);

  const handleOpenCreate = () => {
    setEditProductDetails(null);
    setFormOpen(true);
  };

  const handleOpenEdit = async (product: ProductView) => {
    try {
      const details = await fetchFullProductByIdService(product.id);
      setEditProductDetails(details);
      setFormOpen(true);
    } catch (err) {
      console.error("[FETCH PRODUCT DETAILS ERROR]:", err);
    }
  };

  const handleSaveProduct = async (payload: SaveProductPayload) => {
    await saveProductService(payload);
    await refreshData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product from Aura & Soul?")) {
      await deleteProductService(productId);
      await refreshData();
    }
  };

  const handleQuickAddCategory = async (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const newCat = await createQuickCategoryService(name, slug);
    setCategories([...categories, newCat]);
    return newCat;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-7 h-7 text-emerald-400" /> Aura & Soul Products
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE — Aura & Soul DB</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operations layer — reads and writes go directly to the connected Aura & Soul database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-colors"
            title="Refresh from Aura & Soul"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            disabled={!!connectionError}
            className="inline-flex items-center gap-2 text-xs px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Connection Error Card */}
      {connectionError && (
        <div className="p-6 border border-amber-500/30 rounded-2xl bg-amber-500/5 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-sm font-bold">Cannot Connect to Aura & Soul Database</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{connectionError}</p>
          <Link
            href="/integrations/aura-soul"
            className="inline-flex items-center text-xs px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors"
          >
            Configure Aura & Soul Integration →
          </Link>
        </div>
      )}

      {/* Filters Bar — only show when connected */}
      {!connectionError && (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search products by title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-400" />
          Connecting to Aura & Soul database...
        </div>
      ) : !connectionError ? (
        <ProductTable
          products={products}
          categories={categories}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteProduct}
        />
      ) : null}

      {/* Form Modal */}
      {formOpen && (
        <ProductForm
          initialData={editProductDetails}
          categories={categories}
          collections={collections}
          onSave={handleSaveProduct}
          onClose={() => setFormOpen(false)}
          onQuickAddCategory={handleQuickAddCategory}
        />
      )}
    </div>
  );
}
