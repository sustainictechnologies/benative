-- ============================================================
-- JALAD Homestays · Discover Page Taxonomy
-- Travel Intent (Layer 1) + Landscape (Layer 2)
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- 1. Travel Intent — "why" someone is travelling
CREATE TABLE public.travel_intents (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

-- 2. Landscape — "where" / environment type
CREATE TABLE public.landscapes (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

-- 3. Many-to-Many: Homestay ↔ Travel Intent
CREATE TABLE public.homestay_travel_intents (
  homestay_id     UUID REFERENCES public.homestays(id) ON DELETE CASCADE,
  travel_intent_id INT REFERENCES public.travel_intents(id) ON DELETE CASCADE,
  PRIMARY KEY (homestay_id, travel_intent_id)
);

-- 4. Many-to-Many: Homestay ↔ Landscape
CREATE TABLE public.homestay_landscapes (
  homestay_id   UUID REFERENCES public.homestays(id) ON DELETE CASCADE,
  landscape_id  INT REFERENCES public.landscapes(id) ON DELETE CASCADE,
  PRIMARY KEY (homestay_id, landscape_id)
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.travel_intents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landscapes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_travel_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_landscapes     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "travel_intents_public_read" ON public.travel_intents
  FOR SELECT USING (true);

CREATE POLICY "landscapes_public_read" ON public.landscapes
  FOR SELECT USING (true);

CREATE POLICY "hti_public_read" ON public.homestay_travel_intents
  FOR SELECT USING (true);

CREATE POLICY "hl_public_read" ON public.homestay_landscapes
  FOR SELECT USING (true);

-- ── Seed: Layer 1 — Travel Intent ──────────────────────────────
INSERT INTO public.travel_intents (name, slug, icon, description, sort_order) VALUES
  ('Nature & Habitats',     'nature-habitats',     'Trees',    'Travel centered on wildlife, birding, and natural ecosystems', 1),
  ('Rural Immersion',       'rural-immersion',     'Sprout',   'Live alongside a farming or village community',                2),
  ('Long-Stay Retreats',    'long-stay-retreats',  'Calendar', 'Slow travel for a week or more, work-from-homestay friendly',  3),
  ('On-the-Move Transit',   'on-the-move-transit', 'Route',    'A comfortable stop along a longer journey',                    4)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: Layer 2 — Environment & Landscape ────────────────────
INSERT INTO public.landscapes (name, slug, icon, description, sort_order) VALUES
  ('Forest Borders',              'forest-borders',              'Trees',    'On the edge of forest or reserve land',         1),
  ('Riverside & Backwaters',      'riverside-backwaters',        'Waves',    'Along a river, creek, or backwater',            2),
  ('Untouched Coastal Villages',  'untouched-coastal-villages',  'Anchor',   'Quiet coastal villages away from tourist belts',3),
  ('Mountain Passes & High Valleys','mountain-passes-high-valleys','Mountain','Elevated terrain, ghats, and valleys',         4),
  ('Active Farm Belts',           'active-farm-belts',           'Tractor',  'Surrounded by working agricultural land',       5),
  ('Rocky Plateaus',              'rocky-plateaus',               'Gem',      'Laterite plateaus and rocky highland terrain',  6),
  ('Sacred Groves',                'sacred-groves',                'Flower2',  'Near community-protected sacred forest patches',7),
  ('Wetland Fringes',              'wetland-fringes',              'Droplets', 'Edges of marshes, paddy wetlands, and estuaries',8)
ON CONFLICT (slug) DO NOTHING;
