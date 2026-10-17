-- Security fix, step 3 of 3: signed-out visitors can no longer read hosts' private details.
-- Run once in Supabase Dashboard → SQL Editor, ONLY AFTER the merge to main is live
-- (www.benative.in shows the new site). Run earlier, it breaks the live site: the old
-- code there asks for the phone number on every homestay page, and reads draft
-- previews with the public key.
--
-- Needs step 1 (security_step1_admin_only_writes.sql) first: the admin panel then
-- reads with the admin's own sign-in, which keeps full access.
-- Signed-in visitors can still read phone numbers, as the site promises
-- ("sign up to see contact details").
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

-- 1. Homestays: signed-out visitors may read the public fields only ------------------
-- Not included: contact_phone, whatsapp_number, email, address, draft_data, host_user_id
revoke select on public.homestays from anon;
grant select (
  id, title, slug, location_district, village_name, host_name, calling_window,
  languages_spoken, youtube_video_id, latitude, longitude, geom, is_verified,
  created_at, cover_image_url, updated_at, show_on_homepage, total_rooms,
  max_guests, sub_categories
) on public.homestays to anon;

-- 2. Contact blocks: signed-in visitors only ------------------------------------------
drop policy if exists blocks_public_read on public.homestay_blocks;
create policy blocks_public_read on public.homestay_blocks for select to anon
  using (block_type <> 'contact');
create policy blocks_signed_in_read on public.homestay_blocks for select to authenticated
  using (true);

-- 3. Draft previews: no longer listable by everyone ----------------------------------
-- (The preview page now reads its one preview on the server with the private key.)
drop policy if exists "public read" on public.homestay_previews;

commit;

-- 4. Check: what signed-out visitors can read from homestays ---------------------------
select column_name,
       has_column_privilege('anon', 'public.homestays', column_name, 'select') as signed_out_can_read
from information_schema.columns
where table_schema = 'public' and table_name = 'homestays'
order by ordinal_position;


-- ── UNDO (emergency only: this makes the private details public again) ──────────────
-- begin;
-- grant select on public.homestays to anon;
-- drop policy if exists blocks_public_read on public.homestay_blocks;
-- drop policy if exists blocks_signed_in_read on public.homestay_blocks;
-- create policy blocks_public_read on public.homestay_blocks for select using (true);
-- create policy "public read" on public.homestay_previews for select using (true);
-- commit;
