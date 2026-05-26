import { createClient } from '@/lib/supabase/server'
import ExploreClient from '@/components/ExploreClient'
import type { HomestayWithCategories } from '@/types/blocks.types'

export const revalidate = 60

export default async function MapPage() {
  const supabase = createClient()

  const { data: rawHomestays } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, location_district, village_name,
      host_name, is_verified, latitude, longitude,
      calling_window, languages_spoken,
      homestay_categories ( categories ( id, name, slug ) ),
      homestay_blocks ( block_type, content_data )
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
    categories: (h.homestay_categories ?? [])
      .map((hc: any) => hc.categories)
      .filter(Boolean),
    cover_image_url: (h.homestay_blocks ?? [])
      .find((b: any) => b.block_type === 'hero')
      ?.content_data?.cover_image_url ?? null,
  }))

  return (
    <ExploreClient
      homestays={homestays}
    />
  )
}
