-- ============================================================
-- WhatsApp Bookings
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Run AFTER whatsapp_integration.sql. Safe to re-run.
-- ============================================================

-- 1. Room count per homestay
--    Set by the host over WhatsApp with the ROOMS command.
ALTER TABLE public.homestays
  ADD COLUMN IF NOT EXISTS total_rooms INTEGER CHECK (total_rooms > 0);


-- 2. Unfinished booking
--    Holds a booking the host is still completing or has not yet confirmed.
ALTER TABLE public.whatsapp_identities
  ADD COLUMN IF NOT EXISTS pending_action     JSONB,
  ADD COLUMN IF NOT EXISTS pending_updated_at TIMESTAMPTZ;


-- 3. Bookings
--    check_out is the departure day: a stay occupies the nights from
--    check_in up to, but not including, check_out.
--    Cancelled bookings are kept and marked, never deleted.
CREATE TABLE IF NOT EXISTS public.bookings (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_no          BIGINT      GENERATED ALWAYS AS IDENTITY UNIQUE,
  homestay_id         UUID        NOT NULL REFERENCES public.homestays(id) ON DELETE CASCADE,
  guest_name          TEXT        NOT NULL,
  check_in            DATE        NOT NULL,
  check_out           DATE        NOT NULL,
  rooms               INTEGER     NOT NULL CHECK (rooms > 0),
  guests              INTEGER     NOT NULL CHECK (guests > 0),
  status              TEXT        NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  source              TEXT        NOT NULL DEFAULT 'whatsapp',
  created_by_identity UUID        REFERENCES public.whatsapp_identities(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at        TIMESTAMPTZ,
  CONSTRAINT bookings_dates_valid CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_homestay_dates
  ON public.bookings(homestay_id, check_in, check_out);


-- 4. RLS — the webhook reads and writes with the service-role key (bypasses RLS).
--    No public access needed.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
