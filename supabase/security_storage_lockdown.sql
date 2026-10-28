-- Security fix: file storage (audit findings 1 and 7).
-- Run once in Supabase Dashboard → SQL Editor.
--
-- Safe for both sites (main and review/dev): only the admin builder uploads homestay
-- photos, and admins are signed in on the site when they do. The homepage photos are
-- uploaded by the server with the private key, which these rules don't affect.
-- Photos already stored keep working: the buckets stay public, so photos load by link.
--
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

-- 1. Only admins may upload homestay photos (until now: anyone, even signed out)
drop policy if exists "anyone can upload homestay images" on storage.objects;
create policy homestay_images_admin_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'homestay-images' and (select public.is_admin()));

-- 2. Only admins can list the stored files (until now: anyone). Photos on the site
--    still load by their link, because the bucket is public.
drop policy if exists "public read homestay images" on storage.objects;
create policy homestay_images_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'homestay-images' and (select public.is_admin()));

-- 3. Up to 10 MB per file, and only JPEG, PNG and WebP pictures
--    (today's largest photo is 7 MB, and every stored file is one of these types)
update storage.buckets
set file_size_limit    = 10 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('homestay-images', 'homepage');

commit;

-- 4. Check
select 'bucket: ' || id as item,
       'public: ' || public || ' | limit: ' || (file_size_limit / 1048576) || ' MB | types: ' ||
       array_to_string(allowed_mime_types, ', ') as result
from storage.buckets where id in ('homestay-images', 'homepage')
union all
select 'rule: ' || policyname, cmd || ' | roles: ' || array_to_string(roles, ',') || ' | ' || coalesce(with_check, qual, '-')
from pg_policies where schemaname = 'storage' and tablename = 'objects'
union all
select 'homestay photos uploaded without a sign-in', count(*)::text
from storage.objects where bucket_id = 'homestay-images' and owner is null
order by 1;


-- ── UNDO (emergency only: this reopens the upload hole) ─────────────────────────────
-- begin;
-- drop policy if exists homestay_images_admin_upload on storage.objects;
-- drop policy if exists homestay_images_admin_read on storage.objects;
-- create policy "anyone can upload homestay images" on storage.objects for insert with check (bucket_id = 'homestay-images');
-- create policy "public read homestay images" on storage.objects for select using (bucket_id = 'homestay-images');
-- update storage.buckets set file_size_limit = null, allowed_mime_types = null where id in ('homestay-images', 'homepage');
-- commit;
