-- ============================================================
-- WhatsApp Bookings — v2
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Run AFTER whatsapp_bookings.sql. Safe to re-run.
-- ============================================================

-- 1. Extra booking details
--    Stored only when the host mentions them; never required.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- 2. Keep updated_at current when a booking is changed
--    set_updated_at() was created in whatsapp_integration.sql.
DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
