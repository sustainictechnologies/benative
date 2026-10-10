-- ============================================================
-- Discover — new sub-categories (step 1)
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run.
--
-- This runs alongside the old tag-based categories. Nothing old is changed:
-- the main branch keeps using filter_homestays_spatial and the tags, while
-- review/dev uses the new column and discover_homestays below. Once the new
-- categories are final and merged, the old category tags can be removed —
-- but NOT the spec_* tags, which the Filters button still uses.
--
-- Sub-category keys, by main category:
--   By Place:            by_the_sea, beside_the_water, in_the_hills,
--                        among_the_green, in_the_countryside, away_from_it_all
--   By Type of Home:     family_homes, farm_stays, heritage_homes,
--                        village_homes, eco_nature_homes, homesteads
--   By Kind of Trip:     slow_escapes, weekend_getaways, long_stays,
--                        family_time, for_two, solo_stays,
--                        work_from_somewhere_else
--   By What You Want to Experience:
--                        eat_like_a_local, wake_up_in_nature,
--                        learn_something_new, go_offline, meet_the_people,
--                        do_absolutely_nothing
-- ============================================================


-- 1. The new column: the sub-category keys each homestay belongs to
ALTER TABLE public.homestays
  ADD COLUMN IF NOT EXISTS sub_categories TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_homestays_sub_categories
  ON public.homestays USING GIN (sub_categories);


-- 2. Pre-fill from the existing tags, only where the match is clear.
--    Adds keys and never removes any, so re-running it changes nothing
--    and does not undo choices made later in the admin panel.
WITH mapping (tag_slug, sub_category) AS (
  VALUES
    ('env_coastal',           'by_the_sea'),
    ('env_riverside',         'beside_the_water'),
    ('env_wetland',           'beside_the_water'),
    ('env_mountain_valley',   'in_the_hills'),
    ('env_forest_border',     'among_the_green'),
    ('env_agricultural',      'in_the_countryside'),
    ('env_rocky_plateau',     'away_from_it_all'),
    ('env_sacred_grove',      'away_from_it_all'),
    ('env_wetland',           'away_from_it_all'),
    ('env_agricultural',      'farm_stays'),
    ('rural_immersion',       'village_homes'),
    ('nature_habitat',        'eco_nature_homes'),
    ('long_stay_retreat',     'long_stays'),
    ('spec_quiet_work_setup', 'work_from_somewhere_else'),
    ('nature_habitat',        'wake_up_in_nature'),
    ('spec_native_guide',     'learn_something_new')
),
found AS (
  SELECT ht.homestay_id, ARRAY_AGG(DISTINCT m.sub_category) AS keys
  FROM public.homestay_tags ht
  JOIN public.tags t  ON t.id = ht.tag_id
  JOIN mapping m      ON m.tag_slug = t.slug
  GROUP BY ht.homestay_id
)
UPDATE public.homestays h
SET sub_categories = ARRAY(
  SELECT DISTINCT sub_key FROM unnest(h.sub_categories || found.keys) AS sub_key ORDER BY sub_key
)
FROM found
WHERE found.homestay_id = h.id;


-- 3. The new search for the Discover page.
--    Same results and filters as filter_homestays_spatial, except that the
--    category filter reads the new column. The Filters button's
--    requirements (spec_* tags) work exactly as before.
CREATE OR REPLACE FUNCTION public.discover_homestays(
  min_lat         DOUBLE PRECISION,
  max_lat         DOUBLE PRECISION,
  min_lng         DOUBLE PRECISION,
  max_lng         DOUBLE PRECISION,
  sub_category    TEXT    DEFAULT NULL,
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
  tag_slugs         TEXT[],
  sub_categories    TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH property_tags AS (
    SELECT
      h.id,
      -- tags.slug is VARCHAR; cast it so it can be compared with the TEXT[] filters
      COALESCE(
        ARRAY_AGG(t.slug::TEXT) FILTER (WHERE t.slug IS NOT NULL),
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
    pt.tag_slugs,
    h.sub_categories
  FROM public.homestays h
  JOIN property_tags pt ON pt.id = h.id
  WHERE
    h.latitude  BETWEEN min_lat AND max_lat
    AND h.longitude BETWEEN min_lng AND max_lng
    -- The chosen sub-category
    AND (sub_category IS NULL OR h.sub_categories @> ARRAY[sub_category])
    -- Requirements from the Filters button: any overlap (OR), as before
    AND (
      COALESCE(ARRAY_LENGTH(practical_slugs, 1), 0) = 0
      OR pt.tag_slugs && practical_slugs
    )
  ORDER BY h.created_at DESC;
END;
$$;


-- 4. Check: how many homestays each sub-category has after the pre-fill
SELECT sub_key AS sub_category, COUNT(*) AS homestays
FROM public.homestays, unnest(sub_categories) AS sub_key
GROUP BY sub_key
ORDER BY sub_key;
