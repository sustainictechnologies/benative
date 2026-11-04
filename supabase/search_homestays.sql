-- Search for the homepage search box and the Discover page.
-- Matches a homestay's name, village, district, sub-categories and facilities
-- (public details only), and allows small spelling mistakes ("vanoshee" finds Vanoshi).
--
-- Run once in Supabase Dashboard → SQL Editor. Safe for the live site: it only adds things.
-- The last query shows a test search.

begin;

-- Built-in Postgres add-on for "how similar are these words" (typo-tolerant matching)
create extension if not exists pg_trgm with schema extensions;

-- An earlier version, if any, is replaced
drop function if exists public.search_homestays(text);

create function public.search_homestays(q text)
returns table (
  id                uuid,
  title             text,
  slug              text,
  village_name      text,
  location_district text,
  latitude          double precision,
  longitude         double precision,
  cover_image_url   text,
  sub_categories    text[],
  facilities        text[],
  title_score       real,   -- how well the name matched (1 = as typed)
  place_score       real,   -- how well the village or district matched
  score             real    -- the best match of all
)
language sql
stable
set search_path = public, extensions
as $$
  with term as (
    -- lower case, single spaces, without the characters LIKE treats specially
    select lower(btrim(regexp_replace(regexp_replace(coalesce(q, ''), '[%_\\]', ' ', 'g'), '\s+', ' ', 'g'))) as t
  ),
  stays as (
    select h.id, h.title, h.slug, h.village_name, h.location_district, h.latitude, h.longitude,
           h.cover_image_url, h.sub_categories,
           coalesce(array(
             select tg.name::text
             from public.homestay_tags ht
             join public.tags tg on tg.id = ht.tag_id
             where ht.homestay_id = h.id and tg.slug like 'spec\_%'
             order by tg.name
           ), '{}') as facilities
    from public.homestays h
    where h.latitude <> 0
  ),
  docs as (
    select s.*,
           lower(s.title) as title_doc,
           lower(concat_ws(' ', s.village_name, s.location_district)) as place_doc,
           -- sub-category keys read as words: farm_stays → "farm stays"
           lower(concat_ws(' ',
             array_to_string(array(select replace(k, '_', ' ') from unnest(s.sub_categories) k), ' '),
             array_to_string(s.facilities, ' '))) as kind_doc
    from stays s
  ),
  scored as (
    select d.*,
      -- 1 when the words appear as typed; otherwise how close the nearest word is (4+ letters only)
      (case when d.title_doc like '%' || t || '%' then 1
            when length(t) >= 4 then word_similarity(t, d.title_doc) else 0 end)::real as ts,
      (case when d.place_doc like '%' || t || '%' then 1
            when length(t) >= 4 then word_similarity(t, d.place_doc) else 0 end)::real as ps,
      (case when d.kind_doc like '%' || t || '%' then 1
            when length(t) >= 4 then word_similarity(t, d.kind_doc) else 0 end)::real as ks,
      -- several words ("kerala farm"): each one found somewhere
      (t like '% %' and not exists (
         select 1 from unnest(string_to_array(t, ' ')) w
         where concat_ws(' ', d.title_doc, d.place_doc, d.kind_doc) not like '%' || w || '%'
      )) as all_words
    from docs d, term
    where length(t) >= 2
  )
  select id, title, slug, village_name, location_district, latitude, longitude,
         cover_image_url, sub_categories, facilities,
         ts as title_score,
         ps as place_score,
         greatest(ts, ps, ks, case when all_words then 0.9 else 0 end)::real as score
  from scored
  where greatest(ts, ps, ks, case when all_words then 0.9 else 0 end) >= 0.6
  order by score desc, title
  limit 50;
$$;

grant execute on function public.search_homestays(text) to anon, authenticated;

commit;

-- Check: a test search (should list the farm stays)
select title, round(score::numeric, 2) as score from public.search_homestays('farm');


-- ── UNDO ────────────────────────────────────────────────────────────────────────────
-- drop function if exists public.search_homestays(text);
