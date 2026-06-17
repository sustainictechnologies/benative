-- Add layer column to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS layer TEXT CHECK (layer IN ('intent', 'landscape', 'practical'));

-- Layer 1: Travel Intents (single-select on discover page)
INSERT INTO public.categories (name, slug, layer) VALUES
  ('Nature & Habitats',   'nature-habitats',    'intent'),
  ('Rural Immersion',     'rural-immersion',    'intent'),
  ('Long-Stay Retreats',  'long-stay-retreats', 'intent'),
  ('On-the-Move Transit', 'on-the-move-transit','intent')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, layer = EXCLUDED.layer;

-- Layer 2: Landscapes (multi-select on discover page)
INSERT INTO public.categories (name, slug, layer) VALUES
  ('Forest Borders',                 'forest-borders',               'landscape'),
  ('Riverside & Backwaters',         'riverside-backwaters',         'landscape'),
  ('Untouched Coastal Villages',     'untouched-coastal-villages',   'landscape'),
  ('Mountain Passes & High Valleys', 'mountain-passes-high-valleys', 'landscape'),
  ('Active Farm Belts',              'active-farm-belts',            'landscape'),
  ('Rocky Plateaus',                 'rocky-plateaus',               'landscape'),
  ('Sacred Groves',                  'sacred-groves',                'landscape'),
  ('Wetland Fringes',                'wetland-fringes',              'landscape')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, layer = EXCLUDED.layer;

-- Layer 3: Practical Requirements (multi-select on discover page)
INSERT INTO public.categories (name, slug, layer) VALUES
  ('Stable Network',         'stable-network',         'practical'),
  ('Gated Parking',          'gated-parking',          'practical'),
  ('Solo Female Friendly',   'solo-female-friendly',   'practical'),
  ('Native Guide Available', 'native-guide-available', 'practical'),
  ('Shared Kitchen',         'shared-kitchen',         'practical'),
  ('Hot Water',              'hot-water',              'practical'),
  ('Pet Friendly',           'pet-friendly',           'practical'),
  ('Long Stay Friendly',     'long-stay-friendly',     'practical')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, layer = EXCLUDED.layer;

-- Verify
SELECT layer, count(*) FROM public.categories GROUP BY layer ORDER BY layer;
