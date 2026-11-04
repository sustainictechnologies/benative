-- The views count on homestay pages ("1,248 views" under the name).
-- Run once in Supabase Dashboard → SQL Editor. Safe to run before or after the code is deployed:
-- until it is run, homestay pages simply show no views count.
--
-- Counts the recorded visits to /homestays/<slug>, leaving out robots (search engines, link
-- previews and automated test browsers) and visits opened from the site running locally
-- (localhost) or from the review site and other Vercel test addresses, which are testing.
-- Visitors can get the number only; who visited stays private.
-- Safe to run again after a change: it replaces the function.
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

-- 1. Counting by page stays quick as visits grow ---------------------------------------
create index if not exists idx_page_views_path on public.page_views (path);

-- 2. The count for one homestay ---------------------------------------------------------
create or replace function public.homestay_view_count(p_slug text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.page_views
  where path = '/homestays/' || p_slug
    and coalesce(user_agent, '') !~* 'bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|whatsapp|preview|headless|lighthouse|python|curl|wget'
    and coalesce(referrer, '') !~* '^https?://(localhost|127\.0\.0\.1|[^/:]*\.vercel\.app)(:|/|$)'
$$;

revoke all on function public.homestay_view_count(text) from public;
grant execute on function public.homestay_view_count(text) to anon, authenticated;

commit;

-- 3. Check: each live homestay's count ---------------------------------------------------
select title, public.homestay_view_count(slug) as views
from public.homestays
where latitude <> 0
order by views desc;


-- ── UNDO ────────────────────────────────────────────────────────────────────────────
-- begin;
-- drop function if exists public.homestay_view_count(text);
-- drop index if exists idx_page_views_path;
-- commit;
