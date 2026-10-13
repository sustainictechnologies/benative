-- Homepage slides and main category photos: Indian stock photos (Unsplash, free licence).
-- Chosen on 12 Oct 2026. Slide 4 keeps its uploaded photo.
--
-- This only changes which image each slot points to. The uploaded files stay in the
-- "homepage" storage bucket, so the block at the bottom puts everything back.
-- A new upload in Admin > Homepage Images replaces any of these at any time.
--
-- Run in the Supabase SQL Editor.

UPDATE public.homepage_images AS h
SET    image_url  = v.image_url,
       updated_at = NOW()
FROM (VALUES
  -- Slides
  ('carousel_1',     'https://images.unsplash.com/photo-1549473542-abb911353ac1?w=1600&q=60&auto=format'),  -- Backwater with a fishing boat and palms
  ('carousel_2',     'https://images.unsplash.com/photo-1572782252655-9c8771392601?w=1600&q=60&auto=format'),  -- Fort wall on a green ridge
  ('carousel_3',     'https://images.unsplash.com/photo-1740754010394-7b4d4e46af19?w=1600&q=60&auto=format'),  -- Paddy terraces below the hills
  ('carousel_5',     'https://images.unsplash.com/photo-1592336188635-ec2187e8a45f?w=1600&q=60&auto=format'),  -- Village across the water
  -- Main categories
  ('cat_place',      'https://images.unsplash.com/photo-1600251869898-96138e5e3ad4?w=1200&q=70&auto=format'),  -- Village and fields in a valley
  ('cat_home',       'https://images.unsplash.com/photo-1718613898021-838855f2e3c9?w=1200&q=70&auto=format'),  -- Blue house with a tiled roof
  ('cat_trip',       'https://images.unsplash.com/photo-1723709431768-d749b0d814b9?w=1200&q=70&auto=format'),  -- Car on a winding tea-hill road
  ('cat_experience', 'https://images.unsplash.com/photo-1633410195091-bd66114cef5f?w=1200&q=70&auto=format')   -- Planting paddy by hand
) AS v(slot, image_url)
WHERE h.slot = v.slot;

-- Check: 9 rows, with carousel_4 still pointing at the uploaded file
SELECT slot, label, image_url
FROM   public.homepage_images
WHERE  slot LIKE 'carousel_%' OR slot IN ('cat_place', 'cat_home', 'cat_trip', 'cat_experience')
ORDER  BY slot;


-- ─── To undo ────────────────────────────────────────────────────────────────
-- Puts back the photos that were showing before this script (By the Trip had none).
--
-- UPDATE public.homepage_images AS h
-- SET    image_url  = v.image_url,
--        updated_at = NOW()
-- FROM (VALUES
--   ('carousel_1',     'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/carousel_1.jpg?v=1790264194023'),
--   ('carousel_2',     'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/carousel_2.jpg?v=1790315826036'),
--   ('carousel_3',     'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/carousel_3.jpg?v=1790316360108'),
--   ('carousel_5',     'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/carousel_5.jpg?v=1790315876943'),
--   ('cat_place',      'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/cat_place.jpg?v=1791462965619'),
--   ('cat_home',       'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/cat_home.jpg?v=1790315775234'),
--   ('cat_trip',       NULL),
--   ('cat_experience', 'https://therdoknzwguqijpbqkq.supabase.co/storage/v1/object/public/homepage/cat_experience.jpg?v=1790316329796')
-- ) AS v(slot, image_url)
-- WHERE h.slot = v.slot;
