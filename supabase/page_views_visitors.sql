-- Who visited which page: visits by signed-in visitors carry their account.
-- Run once in Supabase Dashboard → SQL Editor, BEFORE the code that uses it is
-- deployed or run locally. Safe for the live site: its visits are recorded without
-- an account, which stays allowed.
--
-- Needs security_step1_admin_only_writes.sql (the is_admin() helper).
-- Everything runs in one transaction. The last query shows the result.
-- An undo block is at the bottom (commented out).

begin;

-- 1. The account behind each visit (empty for signed-out visitors) -------------------
alter table public.page_views
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_page_views_user
  on public.page_views (user_id, created_at desc)
  where user_id is not null;

-- 2. A visit can only be recorded as yourself, or without an account -----------------
drop policy if exists allow_auth_insert        on public.page_views;
drop policy if exists allow_anon_insert        on public.page_views;
drop policy if exists "Allow anonymous inserts" on public.page_views;
create policy page_views_anon_insert on public.page_views for insert to anon
  with check (user_id is null);
create policy page_views_auth_insert on public.page_views for insert to authenticated
  with check (user_id is null or user_id = auth.uid());

-- 3. Admins can read visitors' names and emails (others still see only their own) ----
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles for select
  using ((select public.is_admin()));

commit;

-- 4. Check -----------------------------------------------------------------------------
select 'page_views.user_id column' as item,
       case when exists (select 1 from information_schema.columns
                         where table_schema = 'public' and table_name = 'page_views'
                           and column_name = 'user_id') then 'added' else 'MISSING' end as result
union all
select 'rule: ' || policyname, tablename || ' | ' || cmd
from pg_policies
where schemaname = 'public'
  and policyname in ('page_views_anon_insert', 'page_views_auth_insert', 'profiles_admin_read');


-- ── UNDO ────────────────────────────────────────────────────────────────────────────
-- begin;
-- drop policy if exists profiles_admin_read on public.profiles;
-- drop policy if exists page_views_anon_insert on public.page_views;
-- drop policy if exists page_views_auth_insert on public.page_views;
-- create policy allow_anon_insert on public.page_views for insert to anon with check (true);
-- create policy allow_auth_insert on public.page_views for insert to authenticated with check (true);
-- drop index if exists idx_page_views_user;
-- alter table public.page_views drop column if exists user_id;
-- commit;
