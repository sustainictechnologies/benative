-- ============================================================
-- WhatsApp Integration — Phase 1
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- 1. WhatsApp Identities
--    Links a WhatsApp phone number to an existing homestay (host).
--    A number may exist before it is matched to a homestay (nullable homestay_id).
CREATE TABLE IF NOT EXISTS public.whatsapp_identities (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  homestay_id          UUID        REFERENCES public.homestays(id) ON DELETE SET NULL,
  whatsapp_phone       TEXT        NOT NULL,
  is_verified          BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT whatsapp_identities_phone_unique UNIQUE (whatsapp_phone)
);

CREATE INDEX IF NOT EXISTS idx_wa_identities_homestay
  ON public.whatsapp_identities(homestay_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wa_identities_updated_at
  BEFORE UPDATE ON public.whatsapp_identities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 2. WhatsApp Messages
--    Logs every inbound and outbound message.
--    meta_message_id is unique — duplicate webhook deliveries are ignored.
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  identity_id      UUID        REFERENCES public.whatsapp_identities(id) ON DELETE SET NULL,
  meta_message_id  TEXT        NOT NULL,
  direction        TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type     TEXT        NOT NULL DEFAULT 'text',
  message_text     TEXT,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT whatsapp_messages_meta_id_unique UNIQUE (meta_message_id)
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_identity
  ON public.whatsapp_messages(identity_id);

CREATE INDEX IF NOT EXISTS idx_wa_messages_received
  ON public.whatsapp_messages(received_at DESC);


-- 3. RLS — webhook writes use the service-role key (bypasses RLS).
--    Admin reads are also via service-role. No public access needed.
ALTER TABLE public.whatsapp_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages   ENABLE ROW LEVEL SECURITY;
