-- ============================================================
-- JALAD Homestays · Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Enable PostGIS FIRST in Dashboard → Database → Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Profiles (linked to Supabase Auth users)
CREATE TABLE public.profiles (
  id         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name  TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Auto-create profile on first sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Categories / Activity Tags
CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT
);

-- 3. Homestays Master Record
CREATE TABLE public.homestays (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  location_district TEXT NOT NULL,
  village_name      TEXT NOT NULL,
  host_name         TEXT NOT NULL,
  contact_phone     TEXT NOT NULL,
  calling_window    TEXT DEFAULT '5:00 PM - 8:00 PM',
  languages_spoken  TEXT[] DEFAULT ARRAY['Marathi', 'Hindi'],
  youtube_video_id  TEXT,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  geom              GEOMETRY(Point, 4326),
  is_verified       BOOLEAN DEFAULT false,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Many-to-Many: Homestay ↔ Categories
CREATE TABLE public.homestay_categories (
  homestay_id UUID REFERENCES public.homestays(id) ON DELETE CASCADE,
  category_id INT  REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (homestay_id, category_id)
);

-- 5. Component Layout Blocks ("Lego Block" engine)
CREATE TABLE public.homestay_blocks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homestay_id  UUID REFERENCES public.homestays(id) ON DELETE CASCADE NOT NULL,
  block_type   TEXT NOT NULL,  -- 'hero' | 'host-story' | 'activity-log' | 'rules-block' | 'video' | 'agri-calendar'
  sort_order   INT  NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 6. Community Reviews
CREATE TABLE public.reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homestay_id UUID REFERENCES public.homestays(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating      INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE (homestay_id, user_id)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX homestays_geo_idx     ON public.homestays USING GIST(geom);
CREATE INDEX idx_blocks_sort       ON public.homestay_blocks(homestay_id, sort_order);
CREATE INDEX idx_reviews_homestay  ON public.reviews(homestay_id);

-- ── Auto-update geometry from lat/lon ────────────────────────
CREATE OR REPLACE FUNCTION update_homestay_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_homestay_geom
  BEFORE INSERT OR UPDATE ON public.homestays
  FOR EACH ROW EXECUTE FUNCTION update_homestay_geom();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestays        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homestay_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews          ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Homestays: public read
CREATE POLICY "homestays_public_read" ON public.homestays
  FOR SELECT USING (true);

-- Categories: public read
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

-- Homestay blocks: public read
CREATE POLICY "blocks_public_read" ON public.homestay_blocks
  FOR SELECT USING (true);

-- Homestay categories: public read
CREATE POLICY "hc_public_read" ON public.homestay_categories
  FOR SELECT USING (true);

-- Reviews: public read, authenticated insert own
CREATE POLICY "reviews_public_read"  ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_auth_insert"  ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Seed: default categories ──────────────────────────────────
INSERT INTO public.categories (name, slug, icon, description) VALUES
  ('Bird Watching',        'birding',       'Bird',       'Spot endemic Konkan avifauna — hornbills, kingfishers, sea eagles'),
  ('Solo Rider Friendly',  'solo-rider',    'Bike',       'Motorcycle-friendly parking, drying space, local route tips'),
  ('Solo Female Safe',     'solo-female',   'ShieldCheck','Personally verified safe for solo female travelers'),
  ('Agriculture Immersion','agri',          'Leaf',       'Alphonso orchards, paddy fields, coconut groves — seasonal farm work'),
  ('Long Stays Welcome',   'long-stay',     'Calendar',   'Rates and facilities suited for stays of a week or more')
ON CONFLICT (slug) DO NOTHING;