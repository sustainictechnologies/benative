-- Security fix, step 1 of 3: only admin accounts can change homestays.
-- Run once in Supabase Dashboard → SQL Editor.
--
-- Safe for both sites (main and review/dev); no code change is needed. While using
-- the admin panel, the admin must also be signed in on the site (avatar at the top
-- right) with one of the admin accounts below. Without that, publishing or deleting
-- fails with an error and nothing is lost.
--
-- Everything runs in one transaction: if any part fails, nothing changes.
-- The last query lists the admin accounts so the result can be checked.
-- To make another account admin later (after it has signed up on the site):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where lower(email) = 'name@example.com');
-- An undo block is at the bottom (commented out).

begin;

-- 1. Mark the admin accounts ---------------------------------------------------------
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) in (
    'sameerpowar0@gmail.com',
    'surajvalanju@gmail.com',
    'sustainic.technologies@gmail.com',
    'support.benative@gmail.com'
  );

-- Stop (and change nothing) if none of them has an account yet
do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'No admin account found. Sign up on the site with one of the admin emails, then run this again.';
  end if;
end $$;

-- 2. People may change only their own name and photo, not their role ----------------
-- (Their profile row is created by the sign-up trigger, which is not affected.)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- 3. Helper: is the signed-in person an admin? ---------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- 4. Homestays, page blocks and tags: only admins may add, change or delete ----------
drop policy if exists admin_insert_homestays on public.homestays;
drop policy if exists admin_update_homestays on public.homestays;
drop policy if exists admin_delete_homestays on public.homestays;
create policy homestays_admin_insert on public.homestays for insert with check ((select public.is_admin()));
create policy homestays_admin_update on public.homestays for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy homestays_admin_delete on public.homestays for delete using ((select public.is_admin()));

drop policy if exists admin_insert_blocks on public.homestay_blocks;
drop policy if exists admin_delete_blocks on public.homestay_blocks;
create policy blocks_admin_insert on public.homestay_blocks for insert with check ((select public.is_admin()));
create policy blocks_admin_update on public.homestay_blocks for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy blocks_admin_delete on public.homestay_blocks for delete using ((select public.is_admin()));

drop policy if exists homestay_tags_write on public.homestay_tags;
drop policy if exists homestay_tags_admin_write on public.homestay_tags;
create policy homestay_tags_admin_insert on public.homestay_tags for insert with check ((select public.is_admin()));
create policy homestay_tags_admin_update on public.homestay_tags for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy homestay_tags_admin_delete on public.homestay_tags for delete using ((select public.is_admin()));

-- 5. Switch off the two old full-rights functions (neither site uses them) -----------
do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('admin_publish_homestay', 'admin_update_homestay_location')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- 6. Private lists: admins only --------------------------------------------------------
-- Host applications (names, phone numbers, emails, addresses) and recommendations
drop policy if exists "Authenticated users can read applications" on public.host_applications;
create policy host_applications_admin_read on public.host_applications for select using ((select public.is_admin()));

drop policy if exists "Authenticated users can read recommendations" on public.homestay_recommendations;
create policy recommendations_admin_read on public.homestay_recommendations for select using ((select public.is_admin()));

-- Visit records (the admin Analytics page)
drop policy if exists allow_auth_select on public.page_views;
create policy page_views_admin_read on public.page_views for select using ((select public.is_admin()));

-- Draft previews and custom activities (the site writes these with the private key)
drop policy if exists "auth write"  on public.homestay_previews;
drop policy if exists "auth update" on public.homestay_previews;
create policy previews_admin_insert on public.homestay_previews for insert with check ((select public.is_admin()));
create policy previews_admin_update on public.homestay_previews for update using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "auth write" on public.custom_activities;
create policy custom_activities_admin_insert on public.custom_activities for insert with check ((select public.is_admin()));

commit;

-- 7. Check: which admin emails are now admin ------------------------------------------
select e.email,
       case
         when u.id is null then 'no account yet: sign up on the site, then make it admin (see top)'
         when p.id is null then 'account has no profile row'
         else coalesce(p.role, '(no role)')
       end as result
from (values
  ('sameerpowar0@gmail.com'),
  ('surajvalanju@gmail.com'),
  ('sustainic.technologies@gmail.com'),
  ('support.benative@gmail.com')
) as e(email)
left join auth.users u on lower(u.email) = e.email
left join public.profiles p on p.id = u.id;


-- ── UNDO (emergency only: this reopens the security holes) ──────────────────────────
-- begin;
-- drop policy if exists homestays_admin_insert on public.homestays;
-- drop policy if exists homestays_admin_update on public.homestays;
-- drop policy if exists homestays_admin_delete on public.homestays;
-- drop policy if exists blocks_admin_insert on public.homestay_blocks;
-- drop policy if exists blocks_admin_update on public.homestay_blocks;
-- drop policy if exists blocks_admin_delete on public.homestay_blocks;
-- drop policy if exists homestay_tags_admin_insert on public.homestay_tags;
-- drop policy if exists homestay_tags_admin_update on public.homestay_tags;
-- drop policy if exists homestay_tags_admin_delete on public.homestay_tags;
-- drop policy if exists host_applications_admin_read on public.host_applications;
-- drop policy if exists recommendations_admin_read on public.homestay_recommendations;
-- drop policy if exists page_views_admin_read on public.page_views;
-- drop policy if exists previews_admin_insert on public.homestay_previews;
-- drop policy if exists previews_admin_update on public.homestay_previews;
-- drop policy if exists custom_activities_admin_insert on public.custom_activities;
-- create policy admin_insert_homestays on public.homestays for insert with check (true);
-- create policy admin_update_homestays on public.homestays for update using (true) with check (true);
-- create policy admin_delete_homestays on public.homestays for delete using (true);
-- create policy admin_insert_blocks on public.homestay_blocks for insert with check (true);
-- create policy admin_delete_blocks on public.homestay_blocks for delete using (true);
-- create policy homestay_tags_write on public.homestay_tags for all using (true) with check (true);
-- create policy "Authenticated users can read applications" on public.host_applications for select using (auth.role() = 'authenticated');
-- create policy "Authenticated users can read recommendations" on public.homestay_recommendations for select using (auth.role() = 'authenticated');
-- create policy allow_auth_select on public.page_views for select to authenticated using (true);
-- create policy "auth write" on public.homestay_previews for insert to authenticated with check (true);
-- create policy "auth update" on public.homestay_previews for update to authenticated using (true) with check (true);
-- create policy "auth write" on public.custom_activities for insert to authenticated with check (true);
-- grant insert, update, delete on public.profiles to anon, authenticated;
-- commit;
