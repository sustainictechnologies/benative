-- Run this once in Supabase Dashboard → SQL Editor
-- Creates a SECURITY DEFINER function so the admin builder can update
-- homestay location without needing a service role key.

create or replace function public.admin_update_homestay_location(
  p_slug      text,
  p_latitude  double precision,
  p_longitude double precision
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.homestays
  set latitude = p_latitude, longitude = p_longitude
  where slug = p_slug
  returning id into v_id;

  if v_id is null then
    return json_build_object('success', false, 'error', 'No homestay found with that slug');
  end if;

  return json_build_object('success', true, 'id', v_id);
end;
$$;

-- Allow anon + authenticated roles to call this function
grant execute on function public.admin_update_homestay_location(text, double precision, double precision)
  to anon, authenticated;
