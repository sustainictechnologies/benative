-- New facility: Pure Vegetarian Food (Discover Filters → Facilities & Stay Preferences → Stay Preferences).
-- Run once in Supabase Dashboard → SQL Editor. Safe for both sites: it only adds a tag, and a
-- homestay only shows it once it is ticked in Admin → Homestays.
-- The list of facilities and their groups lives in lib/facilities.ts.

insert into public.tags (slug, name, layer_level, category)
values ('spec_pure_veg', 'Pure Vegetarian Food', 3, 'comfort_health')
on conflict (slug) do nothing;

-- Check: the new facility next to the existing ones
select slug, name, layer_level, category
from public.tags
where slug like 'spec_%'
order by slug;


-- ── UNDO (only works while no homestay has it ticked) ─────────────────────────────────
-- delete from public.tags where slug = 'spec_pure_veg';
