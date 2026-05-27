-- ─────────────────────────────────────────────────────────────
-- Public profiles table (mirrors auth.users, queryable via RLS)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- Trigger: auto-create profile row when a new user signs up
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
