"use client";

import { useState } from "react";
import { X, Save, Tag, DollarSign, Package, Globe, Layers, Image as ImageIcon } from "lucide-react";
import { slugify } from "@/lib/utils/slugify";
import { MediaGalleryManager, type MediaItem } from "./media-gallery-manager";
import { VariantOptionBuilder, type OptionDraft, type VariantDraft } from "./variant-option-builder";
import { InventoryLogViewer } from "./inventory-log-viewer";
import type { CategoryRow, CollectionRow, ProductStatus } from "@/types/database";
import type { FullProductDetails, SaveProductPayload } from "@/services/product";

interface ProductFormProps {
  initialData?: FullProductDetails | null;
  categories: CategoryRow[];
  collections: CollectionRow[];
  onSave: (payload: SaveProductPayload) => Promise<void>;
  onClose: () => void;
  onQuickAddCategory?: (name: string) => Promise<CategoryRow>;
}

export function ProductForm({
  initialData,
  categories,
  collections,
  onSave,
  onClose,
  onQuickAddCategory,
}: ProductFormProps) {
  const [activeTab, setActiveTab] = useState<"general" | "media" | "pricing" | "variants" | "seo">(
    "general"
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState(initialData?.product.title || "");
  const [slug, setSlug] = useState(initialData?.product.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialData);
  const [description, setDescription] = useState(initialData?.product.description || "");
  const [status, setStatus] = useState<ProductStatus>(initialData?.product.status || "DRAFT");
  const [categoryId, setCategoryId] = useState<string>(initialData?.product.category_id || "");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.product.tags || []);

  // Pricing & Inventory
  const [price, setPrice] = useState<number>(initialData?.product.price ?? 0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(
    initialData?.product.compare_at_price ?? undefined
  );
  const [costPerItem, setCostPerItem] = useState<number | undefined>(
    initialData?.product.cost_per_item ?? undefined
  );
  const [sku, setSku] = useState(initialData?.product.sku || "");
  const [barcode, setBarcode] = useState(initialData?.product.barcode || "");
  const [stockQuantity, setStockQuantity] = useState<number>(initialData?.product.stock_quantity ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    initialData?.product.low_stock_threshold ?? 5
  );
  const [trackInventory, setTrackInventory] = useState(initialData?.product.track_inventory ?? true);
  const [allowBackorder, setAllowBackorder] = useState(initialData?.product.allow_backorder ?? false);

  // Media
  const [images, setImages] = useState<MediaItem[]>(
    initialData?.images
      ? initialData.images.map((img) => ({
          storage_path: img.storage_path,
          public_url: img.public_url,
          alt_text: img.alt_text || "",
          caption: img.caption || "",
          position: img.position,
          is_primary: img.is_primary,
        }))
      : []
  );

  // Variants
  const [options, setOptions] = useState<OptionDraft[]>(
    initialData?.options
      ? initialData.options.map((opt) => ({
          name: opt.name,
          values: opt.values,
          position: opt.position,
        }))
      : []
  );

  const [variants, setVariants] = useState<VariantDraft[]>(
    initialData?.variants
      ? initialData.variants.map((v) => ({
          title: v.title,
          options: v.options,
          price: v.price,
          compare_at_price: v.compare_at_price ?? undefined,
          cost_per_item: v.cost_per_item ?? undefined,
          sku: v.sku ?? "",
          barcode: v.barcode ?? "",
          stock_quantity: v.stock_quantity,
        }))
      : []
  );

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState(initialData?.product.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.product.seo_description || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.product.canonical_url || "");
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.product.og_image_url || "");
  const [robotsMeta, setRobotsMeta] = useState(initialData?.product.robots_meta || "index, follow");
  const [schemaType, setSchemaType] = useState(initialData?.product.schema_type || "Product");
  const [seoKeywords, setSeoKeywords] = useState<string[]>(initialData?.product.seo_keywords || []);
  const [keywordInput, setKeywordInput] = useState("");

  // New Quick Category
  const [newCatName, setNewCatName] = useState("");

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !seoKeywords.includes(trimmed)) {
      setSeoKeywords([...seoKeywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Product title is required.");
      return;
    }
    if (!slug.trim()) {
      setErrorMsg("Product slug is required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await onSave({
        id: initialData?.product.id,
        category_id: categoryId || null,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        price,
        compare_at_price: compareAtPrice || null,
        cost_per_item: costPerItem || null,
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
        track_inventory: trackInventory,
        allow_backorder: allowBackorder,
        status,
        tags,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        canonical_url: canonicalUrl.trim() || null,
        og_image_url: ogImageUrl.trim() || null,
        robots_meta: robotsMeta,
        schema_type: schemaType,
        seo_keywords: seoKeywords,
        images,
        options,
        variants,
        collectionIds: selectedCollections,
      });

      onClose();
    } catch (err: unknown) {
      console.error("[SAVE PRODUCT ERROR]:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  const margin = price && costPerItem ? (((price - costPerItem) / price) * 100).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              {initialData ? `Edit Product: ${initialData.product.title}` : "Create New Product"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production e-commerce product manager with Supabase Storage media, variants, and SEO metadata.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 gap-2 overflow-x-auto text-xs font-medium">
          {[
            { id: "general", label: "General & Details", icon: Tag },
            { id: "media", label: `Media Gallery (${images.length})`, icon: ImageIcon },
            { id: "pricing", label: "Pricing & Stock", icon: DollarSign },
            { id: "variants", label: `Variants (${variants.length})`, icon: Layers },
            { id: "seo", label: "SEO & Search Engine", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 font-medium transition-colors ${
                  isActive
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: GENERAL & DETAILS */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rose Quartz Healing Crystal Bracelet 8mm"
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTitle(val);
                      if (autoSlug) {
                        setSlug(slugify(val));
                      }
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Product Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="HIDDEN">Hidden</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              {/* Slug Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">SEO URL Slug *</label>
                  <label className="text-[11px] text-slate-400 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                    />
                    Auto-generate from Title
                  </label>
                </div>
                <div className="flex items-center">
                  <span className="text-xs px-3 py-2 bg-slate-950 border border-r-0 border-slate-800 rounded-l-lg text-slate-500 font-mono">
                    /products/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value);
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-r-lg text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Product Description</label>
                <textarea
                  rows={4}
                  placeholder="Detailed product story, specifications, dimensions, and craftsmanship notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Category & Collections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">-- No Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Quick Add Category */}
                  {onQuickAddCategory && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Quick add new category"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 flex-1"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (newCatName.trim()) {
                            const newCat = await onQuickAddCategory(newCatName.trim());
                            setCategoryId(newCat.id);
                            setNewCatName("");
                          }
                        }}
                        className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Collections</label>
                  <div className="max-h-28 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    {collections.length === 0 && (
                      <div className="text-[11px] text-slate-500 p-1">No collections created yet.</div>
                    )}
                    {collections.map((col) => (
                      <label key={col.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(col.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollections([...selectedCollections, col.id]);
                            } else {
                              setSelectedCollections(selectedCollections.filter((id) => id !== col.id));
                            }
                          }}
                          className="rounded bg-slate-900 border-slate-800 text-emerald-500"
                        />
                        {col.title}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Product Tags</label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg min-h-[42px]">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 text-emerald-300 rounded-full"
                    >
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-400">
                        &times;
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <input
                      type="text"
                      placeholder="Add tag (Press Enter)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="w-full text-xs px-2 bg-transparent text-slate-200 focus:outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA GALLERY */}
          {activeTab === "media" && (
            <MediaGalleryManager images={images} onChange={setImages} />
          )}

          {/* TAB 3: PRICING & INVENTORY */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              {/* Pricing Cards */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Pricing & Profit Margins
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Selling Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Compare-at Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Original strike-through price"
                      value={compareAtPrice ?? ""}
                      onChange={(e) =>
                        setCompareAtPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Cost per Item ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Wholesale/Manufacturing cost"
                      value={costPerItem ?? ""}
                      onChange={(e) =>
                        setCostPerItem(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                {margin && (
                  <div className="text-xs p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-between">
                    <span>Estimated Profit Margin:</span>
                    <span className="font-mono font-bold text-sm">{margin}%</span>
                  </div>
                )}
              </div>

              {/* Inventory Control */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" /> Inventory & Stock Controls
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      placeholder="e.g. RQ-BRAC-08MM"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Barcode / EAN / UPC</label>
                    <input
                      type="text"
                      placeholder="e.g. 8901234567890"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-900">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackInventory}
                      onChange={(e) => setTrackInventory(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-emerald-500"
                    />
                    Track stock inventory automatically
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowBackorder}
                      onChange={(e) => setAllowBackorder(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-emerald-500"
                    />
                    Continue selling when out of stock (Allow backorders)
                  </label>
                </div>
              </div>

              {/* Audit Logs */}
              {initialData?.inventoryLogs && (
                <InventoryLogViewer logs={initialData.inventoryLogs} />
              )}
            </div>
          )}

          {/* TAB 4: VARIANTS */}
          {activeTab === "variants" && (
            <VariantOptionBuilder
              basePrice={price}
              baseSku={sku}
              options={options}
              variants={variants}
              onOptionsChange={setOptions}
              onVariantsChange={setVariants}
            />
          )}

          {/* TAB 5: SEO & REDIRECTS */}
          {activeTab === "seo" && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" /> Search Engine Optimization (SEO) & Meta
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">SEO Meta Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Rose Quartz Bracelet - Natural Gemstone Jewelry"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">SEO Meta Description</label>
                  <textarea
                    rows={3}
                    placeholder="Compelling search engine description for Google preview..."
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Canonical URL</label>
                    <input
                      type="url"
                      placeholder="https://auraandsoul.com/products/rose-quartz-bracelet"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">OpenGraph Image URL</label>
                    <input
                      type="url"
                      placeholder="Social share preview image URL"
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Robots Meta Directives</label>
                    <select
                      value={robotsMeta}
                      onChange={(e) => setRobotsMeta(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="index, follow">index, follow (Default Public)</option>
                      <option value="noindex, follow">noindex, follow</option>
                      <option value="index, nofollow">index, nofollow</option>
                      <option value="noindex, nofollow">noindex, nofollow (Private)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Structured Data Schema Type</label>
                    <input
                      type="text"
                      value={schemaType}
                      onChange={(e) => setSchemaType(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                {/* SEO Keywords */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">SEO Target Keywords</label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg min-h-[42px]">
                    {seoKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 text-amber-300 rounded-full"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => setSeoKeywords(seoKeywords.filter((_, i) => i !== idx))}
                          className="hover:text-rose-400"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                      <input
                        type="text"
                        placeholder="Add keyword (Press Enter)"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        className="w-full text-xs px-2 bg-transparent text-slate-200 focus:outline-none placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving Product..." : initialData ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
