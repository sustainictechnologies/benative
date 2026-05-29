-- Add extra contact fields to homestays
alter table public.homestays
  add column if not exists whatsapp_number text,
  add column if not exists email           text,
  add column if not exists address         text;
