-- Security fix: signed-in users read only the public homestay fields plus the phone number
-- (audit finding 2). Email, address, WhatsApp number, drafts and host account links become
-- admin-only (the admin pages read them on the server with the private key).
--
-- Run once in Supabase Dashboard → SQL Editor, ONLY AFTER the code that loads the builder,
-- the admin Homestays list, publishing, the host dashboard and host replies through the
-- server is live on BOTH sites (review/dev and main). Run earlier, a site still on the old
-- code can't open homestays in its builder.
--
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

revoke select on public.homestays from authenticated;
grant select (
  id, title, slug, location_district, village_name, host_name, calling_window,
  languages_spoken, youtube_video_id, latitude, longitude, geom, is_verified,
  created_at, cover_image_url, updated_at, show_on_homepage, total_rooms,
  max_guests, sub_categories,
  contact_phone   -- signed-in visitors see the host's phone number, as the site promises
) on public.homestays to authenticated;

commit;

-- Check: what signed-out and signed-in visitors can read from homestays
select column_name,
       has_column_privilege('anon',          'public.homestays', column_name, 'select') as signed_out_can_read,
       has_column_privilege('authenticated', 'public.homestays', column_name, 'select') as signed_in_can_read
from information_schema.columns
where table_schema = 'public' and table_name = 'homestays'
order by ordinal_position;


-- ── UNDO ────────────────────────────────────────────────────────────────────────────
-- grant select on public.homestays to authenticated;
