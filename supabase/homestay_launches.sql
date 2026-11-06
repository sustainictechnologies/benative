-- Launch links: the page a host opens to launch their own homestay on BeNative.
-- Run once in Supabase Dashboard → SQL Editor, BEFORE the code that uses it is deployed or run locally.
--
-- An admin makes a launch link in the builder's Publish dialog. It holds a frozen copy of everything
-- publishing needs (the page, the location, the host's details) and the host's email: the host signs in
-- with that email, presses Launch, and the homestay goes live exactly as the admin prepared it.
-- A link works for 4 days and launches once.
--
-- Only the server (with the private key) reads or writes launch links: they hold the host's details.
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

create table if not exists public.homestay_launches (
  token        uuid primary key default gen_random_uuid(),   -- the secret part of the link
  draft_slug   text not null unique,                         -- the builder draft it launches: one link per draft
  payload      jsonb not null,                               -- what publishing needs, frozen when the link was made
  host_email   text not null,                                -- only this account may launch
  expires_at   timestamptz not null,
  launched_at  timestamptz,
  launched_by  uuid references auth.users (id) on delete set null,
  live_slug    text,                                         -- the page address once live
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.homestay_launches enable row level security;
-- No rules for visitors: signed-out and signed-in visitors can neither read nor change launch links
revoke all on public.homestay_launches from anon, authenticated;

commit;

-- Check ---------------------------------------------------------------------------------
select 'homestay_launches table' as item,
       case when to_regclass('public.homestay_launches') is not null then 'created' else 'MISSING' end as result
union all
select 'visitors can read it',
       case when has_table_privilege('anon', 'public.homestay_launches', 'select')
              or has_table_privilege('authenticated', 'public.homestay_launches', 'select')
            then 'YES - check the rules' else 'no (correct)' end;


-- ── UNDO ────────────────────────────────────────────────────────────────────────────────
-- begin;
-- drop table if exists public.homestay_launches;
-- commit;
