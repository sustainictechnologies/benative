-- ============================================================
-- WhatsApp Bookings — v3
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Run AFTER whatsapp_bookings_v2.sql. Safe to re-run.
-- ============================================================

-- 1. Payment and arrival details on a booking
--    Stored only when the host mentions them; never required.
--    The assistant records these amounts; it has no prices or refund rules.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_amount  NUMERIC(10, 2) CHECK (total_amount >= 0),
  ADD COLUMN IF NOT EXISTS advance_paid  NUMERIC(10, 2) CHECK (advance_paid >= 0),
  ADD COLUMN IF NOT EXISTS check_in_time TIME;


-- 2. Guest limit per homestay
--    The most guests the homestay takes on any one night, across all bookings.
--    Set by the host over WhatsApp; empty means no limit.
ALTER TABLE public.homestays
  ADD COLUMN IF NOT EXISTS max_guests INTEGER CHECK (max_guests > 0);
