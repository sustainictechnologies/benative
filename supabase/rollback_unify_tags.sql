-- ============================================================
-- JALAD Homestays · Rollback: Restore original schema
-- Run this in Supabase Dashboard → SQL Editor
-- Reverses unify_tags_and_properties.sql and filter_homestays_spatial.sql
--
-- Restores:
--   properties         → homestays
--   tags               → categories + travel_intents + landscapes
--   homestay_tags      → homestay_categories + homestay_travel_intents
--                        + homestay_landscapes
-- ============================================================

-- ── 1. Rename properties → homestays ───────────────────────────
ALTER TABLE public.properties RENAME TO homestays;
ALTER INDEX IF EXISTS public.properties_geo_idx RENAME TO homestays_geo_idx;

-- ── 2. Recreate original taxonomy tables ───────────────────────
CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT
);

CREATE TABLE public.travel_intents (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE public.landscapes (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

-- ── 3. Migrate tags data back into original tables ──────────────
INSERT INTO public.categories (name, slug, icon, description)
SELECT name, slug, icon, description FROM public.tags WHERE layer = 'practical';

INSERT INTO public.travel_intents (name, slug, icon, description, sort_order)
SELECT name, slug, icon, description, sort_order FROM public.tags WHERE layer = 'intent';

INSERT INTO public.landscapes (name, slug, icon, description, sort_order)
SELECT name, slug, icon, description, sort_order FROM public.tags WHERE layer = 'landscape';

-- ── 4. Recreate junction tables ─────────────────────────────────
CREATE TABLE public.homestay_categories (
  homestay_id UUID REFERENCES public.homestays(id) ON DELETE CASCADE,
  category_id INT  REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (homestay_id, category_id)
);

CREATE TABLE public.homestay_travel_intents (
  homestay_id      UUID REFERENCES public.homestays(id) ON DELETE CASCADE,
  travel_intent_id INT  REFERENCES public.travel_intents(id) ON DELETE CASCADE,
  PRIMARY KEY (homestay_id, travel_intent_id)
);

CREATE TABLE public.homestay_landscapes (
  homestay_id  UUID REFERENCES public.homestays(id) ON DELETE CASCADE,
  landscape_id INT  REFERENCES public.landscapes(id) ON DELETE CASCADE,
  PRIMARY KEY (homestay_id, landscape_id)
);

-- ── 5. Migrate homestay_tags assignments back ───────────────────
INSERT INTO public.homestay_categories (homestay_id, category_id)
SELECT ht.homestay_id, c.id
FROM public.homestay_tags ht
JOIN public.tags t ON t.id = ht.tag_id AND t.layer = 'practical'
JOIN public.categories c ON c.slug = t.slug
ON CONFLICT (homestay_id, category_id) DO NOTHING;

INSERT INTO public.homestay_travel_intents (homestay_id, travel_intent_id)
SELECT ht.homestay_id, ti.id
FROM public.homestay_tags ht
JOIN public.tags t ON t.id = ht.tag_id AND t.layer = 'intent'
JOIN public.travel_intents ti ON ti.slug = t.slug
ON CONFLICT (homestay_id, travel_intent_id) DO NOTHING;

INSERT INTO public.homestay_landscapes (homestay_id, landscape_id)
SELECT ht.homestay_id, l.id
FROM public.homestay_tags ht
JOIN public.tags t ON t.id = ht.tag_id AND t.layer = 'landscape'
JOIN public.landscapes l ON l.slug = t.slug
ON CONFLICT (homestay_id, landscape_id) DO NOTHING;

-- ── 6. RLS on restored tables ───────────────────────────────────
ALTER TABLE public.categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_intents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landscapes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_travel_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_landscapes     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read"       ON public.categories              FOR SELECT USING (true);
CREATE POLICY "travel_intents_public_read"   ON public.travel_intents          FOR SELECT USING (true);
CREATE POLICY "landscapes_public_read"       ON public.landscapes              FOR SELECT USING (true);
CREATE POLICY "hc_public_read"               ON public.homestay_categories     FOR SELECT USING (true);
CREATE POLICY "hti_public_read"              ON public.homestay_travel_intents FOR SELECT USING (true);
CREATE POLICY "hl_public_read"               ON public.homestay_landscapes     FOR SELECT USING (true);

-- ── 7. Drop unified tables (junction first, then parent) ────────
DROP TABLE IF EXISTS public.homestay_tags;
DROP TABLE IF EXISTS public.tags;

-- ── 8. Drop filter_homestays_spatial RPC ────────────────────────
DROP FUNCTION IF EXISTS public.filter_homestays_spatial(
  double precision, double precision, double precision, double precision,
  text, text[], text[]
);

-- ── 9. Revert admin RPCs back to public.homestays ───────────────
CREATE OR REPLACE FUNCTION public.admin_publish_homestay(
  p_slug            text,
  p_title           text,
  p_host_name       text,
  p_contact_phone   text,
  p_whatsapp_number text,
  p_email           text,
  p_address         text,
  p_languages       text[],
  p_latitude        double precision,
  p_longitude       double precision
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id       uuid;
  v_village  text;
  v_district text;
BEGIN
  v_village  := trim(split_part(p_address, ',', 1));
  v_district := trim(split_part(p_address, ',', 2));
  IF v_district = '' THEN v_district := v_village; END IF;

  UPDATE public.homestays SET
    title             = p_title,
    host_name         = p_host_name,
    contact_phone     = p_contact_phone,
    whatsapp_number   = p_whatsapp_number,
    email             = p_email,
    address           = p_address,
    village_name      = v_village,
    location_district = v_district,
    languages_spoken  = p_languages,
    latitude          = p_latitude,
    longitude         = p_longitude
  WHERE slug = p_slug
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No homestay found with slug: ' || p_slug);
  END IF;

  RETURN json_build_object('success', true, 'id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_homestay_location(
  p_slug      text,
  p_latitude  double precision,
  p_longitude double precision
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.homestays
  SET latitude = p_latitude, longitude = p_longitude
  WHERE slug = p_slug
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No homestay found with that slug');
  END IF;

  RETURN json_build_object('success', true, 'id', v_id);
END;
$$;
