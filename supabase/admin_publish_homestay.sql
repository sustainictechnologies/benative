-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Add missing columns (safe to re-run)
alter table public.homestays
  add column if not exists whatsapp_number text,
  add column if not exists email           text,
  add column if not exists address         text;

-- Step 2: Full publish function
-- Parses "Village, District, State" from address for backwards compatibility
-- with existing app pages that read village_name / location_district.
create or replace function public.admin_publish_homestay(
  p_slug            text,
  p_title           text,
  p_host_name       text,
  p_contact_phone   text,
  p_whatsapp_number text,
  p_email           text,
  p_address         text,
  p_languages       text[],
  p_latitude        double precision,
  p_longitude       double precision
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id       uuid;
  v_village  text;
  v_district text;
begin
  -- Split "Village, District, State" into parts the app already uses
  v_village  := trim(split_part(p_address, ',', 1));
  v_district := trim(split_part(p_address, ',', 2));
  if v_district = '' then v_district := v_village; end if;

  update public.homestays set
    title             = p_title,
    host_name         = p_host_name,
    contact_phone     = p_contact_phone,
    whatsapp_number   = p_whatsapp_number,
    email             = p_email,
    address           = p_address,
    village_name      = v_village,
    location_district = v_district,
    languages_spoken  = p_languages,
    latitude          = p_latitude,
    longitude         = p_longitude
  where slug = p_slug
  returning id into v_id;

  if v_id is null then
    return json_build_object('success', false, 'error', 'No homestay found with slug: ' || p_slug);
  end if;

  return json_build_object('success', true, 'id', v_id);
end;
$$;

grant execute on function public.admin_publish_homestay(
  text, text, text, text, text, text, text, text[], double precision, double precision
) to anon, authenticated;
