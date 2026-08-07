-- Migration: 20260806000037_product_seo.sql
-- Description: Creates database tables for Phase 5.1 Product SEO Engine.

-- 1. Product SEO Profiles Table
CREATE TABLE IF NOT EXISTS public.product_seo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  normalized_keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  seo_title TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  seo_score REAL NOT NULL DEFAULT 0.0,
  validation_score REAL NOT NULL DEFAULT 0.0,
  editorial_queue_id UUID REFERENCES public.editorial_queue(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_seo_profiles_prod ON public.product_seo_profiles(product_id);
CREATE INDEX IF NOT EXISTS idx_product_seo_profiles_kw ON public.product_seo_profiles(normalized_keyword);

-- 2. Product FAQs Table
CREATE TABLE IF NOT EXISTS public.product_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.product_seo_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Product Benefits & Uses Table
CREATE TABLE IF NOT EXISTS public.product_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.product_seo_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'BENEFIT' CHECK (category IN ('BENEFIT', 'HEALING_USE', 'SPECIFICATION')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Product Care Guides Table
CREATE TABLE IF NOT EXISTS public.product_care_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.product_seo_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Product Schema JSON-LD Table
CREATE TABLE IF NOT EXISTS public.product_schema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.product_seo_profiles(id) ON DELETE CASCADE,
  schema_type TEXT NOT NULL,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Product Internal Links Table
CREATE TABLE IF NOT EXISTS public.product_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.product_seo_profiles(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  placement_context TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Product Image Plan Table
CREATE TABLE IF NOT EXISTS public.product_image_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.product_seo_profiles(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  prompt TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL,
  placement TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Grant Access and Disable RLS for Internal Server Operations
GRANT ALL ON TABLE public.product_seo_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_faqs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_benefits TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_care_guides TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_schema TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_internal_links TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.product_image_plan TO postgres, anon, authenticated, service_role;

ALTER TABLE public.product_seo_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_benefits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_care_guides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_schema DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_internal_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_image_plan DISABLE ROW LEVEL SECURITY;
