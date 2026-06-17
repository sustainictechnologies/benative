-- ============================================================
-- BeNative · Discover Page Tag System
-- Run this in Supabase SQL Editor
-- Creates tags + homestay_tags tables and seeds all 27 tags
-- ============================================================

-- ── 1. Master tags dictionary ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  layer_level INT NOT NULL CHECK (layer_level IN (1, 2, 3)),
  category    VARCHAR(50) NOT NULL,
  ui_icon     VARCHAR(50),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tags_render ON public.tags(layer_level, category);

-- ── 2. Seed Layer 1: Travel Intent (4 tags) ──────────────────
INSERT INTO public.tags (slug, name, layer_level, category) VALUES
  ('nature_habitat',    'Nature & Habitats',   1, 'intent'),
  ('rural_immersion',   'Rural Immersion',     1, 'intent'),
  ('long_stay_retreat', 'Long-Stay Retreats',  1, 'intent'),
  ('transit_pitstop',   'On-the-Move Transit', 1, 'intent')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, layer_level = EXCLUDED.layer_level, category = EXCLUDED.category;

-- ── 3. Seed Layer 2: Environment & Landscape (8 tags) ─────────
INSERT INTO public.tags (slug, name, layer_level, category) VALUES
  ('env_forest_border',   'Forest Borders & Buffers',        2, 'environment'),
  ('env_riverside',       'Riverside & Backwaters',          2, 'environment'),
  ('env_coastal',         'Untouched Coastal Villages',      2, 'environment'),
  ('env_mountain_valley', 'Mountain Passes & High Valleys',  2, 'environment'),
  ('env_agricultural',    'Active Farm Belts & Plantations', 2, 'environment'),
  ('env_rocky_plateau',   'Plateaus & Rocky Terrains',       2, 'environment'),
  ('env_sacred_grove',    'Sacred Groves & Hidden Orchards', 2, 'environment'),
  ('env_wetland',         'Lakeside & Wetland Fringes',      2, 'environment')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, layer_level = EXCLUDED.layer_level, category = EXCLUDED.category;

-- ── 4. Seed Layer 3: Practical Requirements (15 tags) ─────────
INSERT INTO public.tags (slug, name, layer_level, category) VALUES
  ('spec_gated_parking',        'Gated Parking',               3, 'logistics'),
  ('spec_basic_toolkit',        'Basic Toolkit Available',     3, 'logistics'),
  ('spec_pet_friendly',         'Pet-Friendly Compound',       3, 'animal_wildlife'),
  ('spec_wildlife_secure',      'Wildlife-Proof Safety',       3, 'animal_wildlife'),
  ('spec_stable_network',       'Stable Network',              3, 'infrastructure'),
  ('spec_shared_kitchen',       'Shared Kitchen',              3, 'infrastructure'),
  ('spec_power_backup',         'Power Backup',                3, 'infrastructure'),
  ('spec_laundry_access',       'Laundry Access',              3, 'infrastructure'),
  ('spec_native_guide',         'Native Guide Available',      3, 'niche_eco'),
  ('spec_plastic_free',         'Plastic-Free Stay',           3, 'niche_eco'),
  ('spec_western_toilet',       'Western-Style Toilet',        3, 'comfort_health'),
  ('spec_hot_water',            'Running Hot Water / Geyser',  3, 'comfort_health'),
  ('spec_no_stairs_access',     'Ground Floor / No-Stairs',    3, 'accessibility'),
  ('spec_quiet_work_setup',     'Quiet Work Setup',            3, 'work_focus'),
  ('spec_solo_female_friendly', 'Solo-Female Friendly',        3, 'social_vetting')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, layer_level = EXCLUDED.layer_level, category = EXCLUDED.category;

-- ── 5. Junction table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.homestay_tags (
  id          BIGSERIAL PRIMARY KEY,
  homestay_id UUID REFERENCES public.homestays(id) ON DELETE CASCADE NOT NULL,
  tag_id      INT  REFERENCES public.tags(id)      ON DELETE CASCADE NOT NULL,
  CONSTRAINT unique_homestay_tag UNIQUE(homestay_id, tag_id)
);

-- Composite index for instant tag matching during map intersections
CREATE INDEX IF NOT EXISTS idx_junction_lookup ON public.homestay_tags(tag_id, homestay_id);

-- ── 6. Row Level Security ─────────────────────────────────────
ALTER TABLE public.tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_public_read"          ON public.tags;
DROP POLICY IF EXISTS "homestay_tags_public_read" ON public.homestay_tags;
DROP POLICY IF EXISTS "homestay_tags_admin_write" ON public.homestay_tags;

CREATE POLICY "tags_public_read"
  ON public.tags FOR SELECT USING (true);

CREATE POLICY "homestay_tags_public_read"
  ON public.homestay_tags FOR SELECT USING (true);

CREATE POLICY "homestay_tags_admin_write"
  ON public.homestay_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── 7. Spatial filter RPC ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.filter_homestays_spatial(
  min_lat         DOUBLE PRECISION,
  max_lat         DOUBLE PRECISION,
  min_lng         DOUBLE PRECISION,
  max_lng         DOUBLE PRECISION,
  intent_slug     TEXT    DEFAULT NULL,
  landscape_slugs TEXT[]  DEFAULT '{}',
  practical_slugs TEXT[]  DEFAULT '{}'
)
RETURNS TABLE (
  id                UUID,
  title             TEXT,
  slug              TEXT,
  location_district TEXT,
  village_name      TEXT,
  host_name         TEXT,
  is_verified       BOOLEAN,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  calling_window    TEXT,
  languages_spoken  TEXT[],
  cover_image_url   TEXT,
  tag_slugs         TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH property_tags AS (
    SELECT
      h.id,
      COALESCE(
        ARRAY_AGG(t.slug) FILTER (WHERE t.slug IS NOT NULL),
        '{}'::TEXT[]
      ) AS tag_slugs
    FROM public.homestays h
    LEFT JOIN public.homestay_tags ht ON ht.homestay_id = h.id
    LEFT JOIN public.tags t ON t.id = ht.tag_id
    GROUP BY h.id
  )
  SELECT
    h.id, h.title, h.slug,
    h.location_district, h.village_name, h.host_name,
    h.is_verified, h.latitude, h.longitude,
    h.calling_window, h.languages_spoken, h.cover_image_url,
    pt.tag_slugs
  FROM public.homestays h
  JOIN property_tags pt ON pt.id = h.id
  WHERE
    h.latitude  BETWEEN min_lat AND max_lat
    AND h.longitude BETWEEN min_lng  AND max_lng
    -- Layer 1: exact match (AND)
    AND (intent_slug IS NULL OR pt.tag_slugs @> ARRAY[intent_slug])
    -- Layer 2: any overlap (OR)
    AND (
      COALESCE(ARRAY_LENGTH(landscape_slugs, 1), 0) = 0
      OR pt.tag_slugs && landscape_slugs
    )
    -- Layer 3: any overlap (OR)
    AND (
      COALESCE(ARRAY_LENGTH(practical_slugs, 1), 0) = 0
      OR pt.tag_slugs && practical_slugs
    )
  ORDER BY h.created_at DESC;
END;
$$;

-- ── Verify ────────────────────────────────────────────────────
SELECT layer_level, category, COUNT(*) FROM public.tags GROUP BY layer_level, category ORDER BY layer_level, category;
