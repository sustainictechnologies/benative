-- The builder's SEO panel: each homestay's own Google title, description and focus keyword.
-- Run once in Supabase Dashboard → SQL Editor. Safe to run before or after the code is deployed, and
-- safe to run again. Until it is run, homestay pages use their automatic title and description, and
-- Publish works as before as long as the SEO panel is left empty.
--
-- Empty fields mean "automatic". The focus keyword is only for the panel's checks, so visitors are
-- not given it; the title and description are on every page anyway, so visitors may read them.
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

-- 1. The three fields ---------------------------------------------------------------------
alter table public.homestays
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  add column if not exists focus_keyword   text;

-- 2. Visitors read the title and description with the page ---------------------------------
-- (Visitors may only read listed columns: see security_step3_hide_private_details.sql
-- and security_signed_in_reads.sql.)
grant select (seo_title, seo_description) on public.homestays to anon, authenticated;

commit;

-- 3. Check: the fields, and who can read them ---------------------------------------------------
select column_name,
       has_column_privilege('anon',          'public.homestays', column_name, 'select') as signed_out_can_read,
       has_column_privilege('authenticated', 'public.homestays', column_name, 'select') as signed_in_can_read
from information_schema.columns
where table_schema = 'public' and table_name = 'homestays'
  and column_name in ('seo_title', 'seo_description', 'focus_keyword')
order by ordinal_position;


-- ── UNDO (removes the fields and everything saved in them) ─────────────────────────────────
-- begin;
-- alter table public.homestays
--   drop column if exists seo_title,
--   drop column if exists seo_description,
--   drop column if exists focus_keyword;
-- commit;
