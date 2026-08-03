"use server";

/**
 * services/product.ts
 *
 * Product Management Service Layer — Aura OS Operations Layer.
 *
 * IMPORTANT: Aura OS does NOT own a local product catalog.
 * All product reads and writes are routed through the Aura & Soul
 * external connector, which targets the live Aura & Soul Supabase project.
 * No product data is duplicated or stored locally in Aura OS.
 */

import {
  getProducts as connectorGetProducts,
  getFullProduct as connectorGetFullProduct,
  getExternalCategories,
  getExternalCollections,
  createExternalProduct,
  updateExternalProduct,
  deleteExternalProduct,
  upsertExternalProductImages,
  upsertExternalVariantOptions,
  upsertExternalProductVariants,
  createExternalCategory,
} from "@/services/connectors/aura-soul/products";
import type {
  ExternalProductFilters,
} from "@/services/connectors/aura-soul/products";
import type {
  ProductRow,
  CategoryRow,
  CollectionRow,
  ProductImageRow,
  VariantOptionRow,
  ProductVariantRow,
  InventoryLogRow,
  ProductStatus,
} from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Local type declarations — no cross-module interface leakage
// ─────────────────────────────────────────────────────────────

/**
 * ProductView — the shape returned by all product fetch operations.
 * Declared locally to avoid importing from a "use server" connector module.
 */
export interface ProductView extends ProductRow {
  primary_image_url?: string | null;
  category?: CategoryRow | null;
}

/**
 * FullProductDetails — the complete product record with relations.
 */
export interface FullProductDetails {
  product: ProductRow;
  images: ProductImageRow[];
  options: VariantOptionRow[];
  variants: ProductVariantRow[];
  inventoryLogs: InventoryLogRow[];
}

export interface SaveProductPayload {
  id?: string;
  category_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  cost_per_item?: number | null;
  sku?: string | null;
  barcode?: string | null;
  stock_quantity: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  status: ProductStatus;
  sort_order?: number;
  has_variants?: boolean;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  og_image_url?: string | null;
  robots_meta?: string;
  schema_type?: string;
  seo_keywords?: string[];
  images?: Array<{
    storage_path: string;
    public_url: string;
    alt_text?: string | null;
    caption?: string | null;
    position: number;
    is_primary: boolean;
    width?: number | null;
    height?: number | null;
  }>;
  options?: Array<{ name: string; values: string[]; position: number }>;
  variants?: Array<{
    title: string;
    options: Record<string, string>;
    price: number;
    compare_at_price?: number | null;
    cost_per_item?: number | null;
    sku?: string | null;
    barcode?: string | null;
    stock_quantity: number;
    image_id?: string | null;
  }>;
  collectionIds?: string[];
}

// ─────────────────────────────────────────────────────────────
// Fetch services — proxy to external connector
// ─────────────────────────────────────────────────────────────

export async function fetchProductsService(
  filters?: ExternalProductFilters,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ProductView[]> {
  return connectorGetProducts(filters, clientOverride, userIdOverride) as Promise<ProductView[]>;
}

export async function fetchCategoriesService(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CategoryRow[]> {
  return getExternalCategories(clientOverride, userIdOverride);
}

export async function fetchCollectionsService(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CollectionRow[]> {
  return getExternalCollections(clientOverride, userIdOverride);
}

export async function fetchFullProductByIdService(
  productId: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<FullProductDetails | null> {
  return connectorGetFullProduct(productId, clientOverride, userIdOverride) as Promise<FullProductDetails | null>;
}

// ─────────────────────────────────────────────────────────────
// Write services — proxy to external connector
// ─────────────────────────────────────────────────────────────

export async function saveProductService(
  payload: SaveProductPayload,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ProductRow> {
  const writePayload = {
    category_id: payload.category_id ?? null,
    title: payload.title,
    slug: payload.slug,
    description: payload.description ?? null,
    price: payload.price,
    compare_at_price: payload.compare_at_price ?? null,
    cost_per_item: payload.cost_per_item ?? null,
    sku: payload.sku ?? null,
    barcode: payload.barcode ?? null,
    stock_quantity: payload.stock_quantity,
    low_stock_threshold: payload.low_stock_threshold ?? 5,
    track_inventory: payload.track_inventory ?? true,
    allow_backorder: payload.allow_backorder ?? false,
    status: payload.status,
    sort_order: payload.sort_order ?? 0,
    has_variants: Boolean(payload.options && payload.options.length > 0),
    tags: payload.tags ?? [],
    seo_title: payload.seo_title ?? null,
    seo_description: payload.seo_description ?? null,
    canonical_url: payload.canonical_url ?? null,
    og_image_url: payload.og_image_url ?? null,
    robots_meta: payload.robots_meta ?? "index, follow",
    schema_type: payload.schema_type ?? "Product",
    seo_keywords: payload.seo_keywords ?? [],
  };

  let savedProduct: ProductRow;

  if (payload.id) {
    savedProduct = await updateExternalProduct(payload.id, writePayload, clientOverride, userIdOverride);
  } else {
    savedProduct = await createExternalProduct(writePayload, clientOverride, userIdOverride);
  }

  if (payload.images !== undefined) {
    await upsertExternalProductImages(savedProduct.id, payload.images, clientOverride, userIdOverride);
  }

  if (payload.options !== undefined) {
    await upsertExternalVariantOptions(savedProduct.id, payload.options, clientOverride, userIdOverride);
  }

  if (payload.variants !== undefined) {
    await upsertExternalProductVariants(savedProduct.id, payload.variants, clientOverride, userIdOverride);
  }

  return savedProduct;
}

export async function deleteProductService(
  productId: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<void> {
  return deleteExternalProduct(productId, clientOverride, userIdOverride);
}

export async function createQuickCategoryService(
  name: string,
  slug: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CategoryRow> {
  return createExternalCategory(name, slug, clientOverride, userIdOverride);
}
