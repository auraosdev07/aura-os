"use server";

/**
 * services/connectors/aura-soul/products.ts
 *
 * Full CRUD connector for the external Aura & Soul products database.
 * All reads and writes target the connected Aura & Soul Supabase project directly.
 * Aura OS stores NO product data locally.
 */

import { getAuraSoulExternalClient } from "./connection";
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

export interface ExternalProductView extends ProductRow {
  primary_image_url?: string | null;
  category?: CategoryRow | null;
}

export interface ExternalProductFilters {
  search?: string;
  status?: string;
  categoryId?: string;
}

export interface ExternalFullProductDetails {
  product: ProductRow;
  images: ProductImageRow[];
  options: VariantOptionRow[];
  variants: ProductVariantRow[];
  inventoryLogs: InventoryLogRow[];
}

// ─────────────────────────────────────────────────────────────
// READ operations
// ─────────────────────────────────────────────────────────────

/** Fetch products list from external Aura & Soul database with optional filters. */
export async function getProducts(
  filters?: ExternalProductFilters,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ExternalProductView[]> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  let query = client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
    );
  }

  const { data: products, error } = await query;
  if (error) throw new Error(`External Products Query Error: ${error.message}`);
  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const { data: images } = await client
    .from("product_images")
    .select("*")
    .in("product_id", productIds)
    .order("position", { ascending: true });

  const primaryMap: Record<string, string> = {};
  (images || []).forEach((img: ProductImageRow) => {
    if (img.is_primary || !primaryMap[img.product_id]) {
      primaryMap[img.product_id] = img.public_url;
    }
  });

  return products.map((p) => ({
    ...p,
    primary_image_url: primaryMap[p.id] || null,
  }));
}

/** Fetch full product details (images, options, variants, logs) from external database. */
export async function getFullProduct(
  id: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ExternalFullProductDetails | null> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { data: product, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) return null;

  const [imagesRes, optionsRes, variantsRes, logsRes] = await Promise.all([
    client.from("product_images").select("*").eq("product_id", id).order("position"),
    client.from("variant_options").select("*").eq("product_id", id).order("position"),
    client.from("product_variants").select("*").eq("product_id", id),
    client.from("inventory_logs").select("*").eq("product_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  return {
    product,
    images: imagesRes.data || [],
    options: optionsRes.data || [],
    variants: variantsRes.data || [],
    inventoryLogs: logsRes.data || [],
  };
}

/** Fetch categories from external Aura & Soul database. */
export async function getExternalCategories(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CategoryRow[]> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(`External Categories Error: ${error.message}`);
  return data || [];
}

/** Fetch collections from external Aura & Soul database. */
export async function getExternalCollections(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CollectionRow[]> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);
  const { data, error } = await client
    .from("collections")
    .select("*")
    .order("title", { ascending: true });
  // Table may not exist in this schema version — return empty gracefully
  if (error) return [];
  return data || [];
}

// ─────────────────────────────────────────────────────────────
// WRITE operations (all target external Aura & Soul database)
// ─────────────────────────────────────────────────────────────

interface ProductWritePayload {
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
}

/** INSERT a new product into the external Aura & Soul database. */
export async function createExternalProduct(
  payload: ProductWritePayload,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ProductRow> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { data, error } = await client
    .from("products")
    .insert({
      ...payload,
      low_stock_threshold: payload.low_stock_threshold ?? 5,
      track_inventory: payload.track_inventory ?? true,
      allow_backorder: payload.allow_backorder ?? false,
      sort_order: payload.sort_order ?? 0,
      has_variants: payload.has_variants ?? false,
      tags: payload.tags ?? [],
      seo_keywords: payload.seo_keywords ?? [],
      robots_meta: payload.robots_meta ?? "index, follow",
      schema_type: payload.schema_type ?? "Product",
    })
    .select("*")
    .single();

  if (error) throw new Error(`External Product Create Error: ${error.message}`);
  return data;
}

/** UPDATE an existing product in the external Aura & Soul database. */
export async function updateExternalProduct(
  productId: string,
  payload: Partial<ProductWritePayload>,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<ProductRow> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { data, error } = await client
    .from("products")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) throw new Error(`External Product Update Error: ${error.message}`);
  return data;
}

/** Soft-delete a product in the external Aura & Soul database. */
export async function deleteExternalProduct(
  productId: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<void> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { error } = await client
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "ARCHIVED" })
    .eq("id", productId);

  if (error) throw new Error(`External Product Delete Error: ${error.message}`);
}

/** Upsert product images in the external Aura & Soul database. */
export async function upsertExternalProductImages(
  productId: string,
  images: Array<{
    storage_path: string;
    public_url: string;
    alt_text?: string | null;
    caption?: string | null;
    position: number;
    is_primary: boolean;
    width?: number | null;
    height?: number | null;
  }>,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<void> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  // Delete existing images and re-insert in correct order
  await client.from("product_images").delete().eq("product_id", productId);

  if (images.length === 0) return;

  const rows = images.map((img) => ({ ...img, product_id: productId }));
  const { error } = await client.from("product_images").insert(rows);
  if (error) throw new Error(`External Product Images Error: ${error.message}`);
}

/** Upsert variant options in the external Aura & Soul database. */
export async function upsertExternalVariantOptions(
  productId: string,
  options: Array<{ name: string; values: string[]; position: number }>,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<void> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  await client.from("variant_options").delete().eq("product_id", productId);
  if (options.length === 0) return;

  const rows = options.map((opt) => ({
    product_id: productId,
    name: opt.name,
    values: opt.values,
    position: opt.position,
  }));
  const { error } = await client.from("variant_options").insert(rows);
  if (error) throw new Error(`External Variant Options Error: ${error.message}`);
}

/** Upsert product variants in the external Aura & Soul database. */
export async function upsertExternalProductVariants(
  productId: string,
  variants: Array<{
    title: string;
    options: Record<string, string>;
    price: number;
    compare_at_price?: number | null;
    cost_per_item?: number | null;
    sku?: string | null;
    barcode?: string | null;
    stock_quantity: number;
    image_id?: string | null;
  }>,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<void> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  await client.from("product_variants").update({ deleted_at: new Date().toISOString() }).eq("product_id", productId);
  if (variants.length === 0) return;

  const rows = variants.map((v) => ({
    product_id: productId,
    title: v.title,
    options: v.options,
    price: v.price,
    compare_at_price: v.compare_at_price ?? null,
    cost_per_item: v.cost_per_item ?? null,
    sku: v.sku ?? null,
    barcode: v.barcode ?? null,
    stock_quantity: v.stock_quantity,
    image_id: v.image_id ?? null,
  }));
  const { error } = await client.from("product_variants").insert(rows);
  if (error) throw new Error(`External Variants Error: ${error.message}`);
}

/** Create a quick category in the external Aura & Soul database. */
export async function createExternalCategory(
  name: string,
  slug: string,
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<CategoryRow> {
  const { client } = await getAuraSoulExternalClient(clientOverride, userIdOverride);

  const { data, error } = await client
    .from("categories")
    .insert({ name, slug, description: null, image_url: null })
    .select("*")
    .single();

  if (error) throw new Error(`External Category Create Error: ${error.message}`);
  return data;
}
