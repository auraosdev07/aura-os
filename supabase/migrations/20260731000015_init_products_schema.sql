-- Migration: 20260731000015_init_products_schema.sql
-- Enterprise Product Management Schema for Aura & Soul CMS & Storefront

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Pricing & Costs
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  compare_at_price NUMERIC(10,2),
  cost_per_item NUMERIC(10,2),
  
  -- Inventory Tracking
  sku TEXT,
  barcode TEXT,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  allow_backorder BOOLEAN NOT NULL DEFAULT false, -- Continue selling when out of stock
  
  -- Display & Status
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED'
  sort_order INT NOT NULL DEFAULT 0,
  has_variants BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Enterprise SEO Metadata
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  og_image_url TEXT,
  robots_meta TEXT NOT NULL DEFAULT 'index, follow',
  schema_type TEXT NOT NULL DEFAULT 'Product',
  seo_keywords TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. Product Collections Junction Table
CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);

-- 5. Dedicated Normalized Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  position INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Normalized Variant Option Definitions (e.g. Size, Color, Material, Finish, Weight)
CREATE TABLE IF NOT EXISTS public.variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Size"
  values TEXT[] NOT NULL DEFAULT '{}', -- e.g. ["S", "M", "L"]
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Normalized Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "Gold / Large"
  options JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "Color": "Gold", "Size": "Large" }
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  compare_at_price NUMERIC(10,2),
  cost_per_item NUMERIC(10,2),
  sku TEXT,
  barcode TEXT,
  stock_quantity INT NOT NULL DEFAULT 0,
  image_id UUID REFERENCES public.product_images(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Inventory Audit Logs Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  before_quantity INT NOT NULL,
  after_quantity INT NOT NULL,
  change_quantity INT NOT NULL,
  reason TEXT NOT NULL, -- 'MANUAL_ADJUSTMENT', 'INITIAL_STOCK', 'RESTOCK', 'SALE'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. URL Redirects Table (Preserves previous product slugs)
CREATE TABLE IF NOT EXISTS public.url_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_path TEXT NOT NULL UNIQUE,
  target_path TEXT NOT NULL,
  status_code INT NOT NULL DEFAULT 301,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing Strategy
CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_sort ON public.products(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_url_redirects_source ON public.url_redirects(source_path);

-- Storage Bucket Setup for Product Media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;

-- Management Policies (Authenticated Owner)
CREATE POLICY "Users manage own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users manage own collections" ON public.collections FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users manage own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users manage own url_redirects" ON public.url_redirects FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Child Table RLS
CREATE POLICY "Users manage product images" ON public.product_images FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_images.product_id AND owner_id = auth.uid()));
CREATE POLICY "Users manage variant options" ON public.variant_options FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = variant_options.product_id AND owner_id = auth.uid()));
CREATE POLICY "Users manage product variants" ON public.product_variants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_variants.product_id AND owner_id = auth.uid()));
CREATE POLICY "Users manage product collections" ON public.product_collections FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_collections.product_id AND owner_id = auth.uid()));
CREATE POLICY "Users manage inventory logs" ON public.inventory_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = inventory_logs.product_id AND owner_id = auth.uid()));

-- Public Storefront Access (Read-only for Active Products)
CREATE POLICY "Public view active products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'ACTIVE' AND deleted_at IS NULL);
CREATE POLICY "Public view categories" ON public.categories FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
CREATE POLICY "Public view collections" ON public.collections FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
CREATE POLICY "Public view product images" ON public.product_images FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_images.product_id AND status = 'ACTIVE' AND deleted_at IS NULL));
CREATE POLICY "Public view product variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_variants.product_id AND status = 'ACTIVE' AND deleted_at IS NULL));
CREATE POLICY "Public view variant options" ON public.variant_options FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE id = variant_options.product_id AND status = 'ACTIVE' AND deleted_at IS NULL));

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.products, public.categories, public.collections, public.product_images, public.product_variants, public.variant_options, public.url_redirects TO anon;
