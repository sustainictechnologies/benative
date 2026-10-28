-- Security fix: profile photos and tidy-up (audit: "two bugs" and finding 9).
-- Run once in Supabase Dashboard → SQL Editor. Safe for both sites (main and review/dev):
-- it needs no code change, and nothing in either site's code uses what it removes.
--
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

-- 1. Profile photos: the "avatars" storage the profile page uploads to did not exist.
--    Public (photos load by link), up to 2 MB, pictures only. Each signed-in person may only
--    add, replace or see files in their own folder: <their account id>/avatar.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_own_insert on storage.objects;
drop policy if exists avatars_own_update on storage.objects;
drop policy if exists avatars_own_read   on storage.objects;
create policy avatars_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_own_update on storage.objects for update to authenticated
  using      (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Replacing a photo also needs to see your own file
create policy avatars_own_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 2. Tidy-up: the old Discover search function (neither site uses it any more)
drop function if exists public.filter_homestays_spatial(
  double precision, double precision, double precision, double precision, text, text[], text[]);

-- 3. Tidy-up: two profile rules that only repeat "profiles_own" (people use their own row)
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

commit;

-- 4. Check
select 'bucket: ' || id as item,
       'public: ' || public || ' | limit: ' || (file_size_limit / 1048576.0)::numeric(4,1) || ' MB | types: ' ||
       array_to_string(allowed_mime_types, ', ') as result
from storage.buckets where id = 'avatars'
union all
select 'storage rule: ' || policyname, cmd || ' | ' || coalesce(with_check, qual)
from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'avatars%'
union all
select 'profile rule: ' || policyname, cmd || ' | ' || coalesce(qual, '-')
from pg_policies where schemaname = 'public' and tablename = 'profiles'
union all
select 'old search function still there', (count(*) > 0)::text
from pg_proc where proname = 'filter_homestays_spatial'
order by 1;


-- ── UNDO ────────────────────────────────────────────────────────────────────────────
-- begin;
-- drop policy if exists avatars_own_insert on storage.objects;
-- drop policy if exists avatars_own_update on storage.objects;
-- drop policy if exists avatars_own_read   on storage.objects;
-- delete from storage.buckets where id = 'avatars';   -- only works while it holds no files
-- create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
-- create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
-- commit;
-- (The old search function is not restored; it can be recreated from git history if ever needed.)
