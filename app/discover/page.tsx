import { createClient } from '@/lib/supabase/server'
import DiscoverClient from '@/components/discover/DiscoverClient'
import type { HomestayWithCategories } from '@/types/blocks.types'

export const revalidate = 60

export default async function DiscoverPage() {
  const supabase = createClient()

  const { data: rawHomestays } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, location_district, village_name,
      host_name, is_verified, latitude, longitude,
      calling_window, languages_spoken, cover_image_url,
      homestay_tags ( tags ( id, name, slug ) )
    `)
    .order('created_at', { ascending: false })

  const homestays: HomestayWithCategories[] = (rawHomestays ?? []).map((h: any) => ({
    id: h.id,
    title: h.title,
    slug: h.slug,
    location_district: h.location_district,
    village_name: h.village_name,
    host_name: h.host_name,
    is_verified: h.is_verified,
    latitude: h.latitude,
    longitude: h.longitude,
    calling_window: h.calling_window,
    languages_spoken: h.languages_spoken ?? [],
    categories: (h.homestay_tags ?? [])
      .map((ht: any) => ht.tags)
      .filter(Boolean),
    cover_image_url: h.cover_image_url ?? null,
  }))

  return <DiscoverClient homestays={homestays} />
}
