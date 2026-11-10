import { createClient } from '@/lib/supabase/server'
import ExploreClient from '@/components/ExploreClient'
import type { HomestayWithCategories } from '@/types/blocks.types'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Homestays on the Map · BeNative',
  description: 'Browse BeNative homestays across India on a map. Pan and zoom to see the family run stays in any region.',
  path: '/map',
})

export const revalidate = 60

export default async function MapPage() {
  const supabase = createClient()

  const { data: rawHomestays } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, location_district, village_name,
      host_name, is_verified, latitude, longitude,
      calling_window, languages_spoken, cover_image_url,
      homestay_tags ( tags ( id, name, slug ) )
    `)
    .neq('latitude', 0)
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

  return (
    <>
      {/* The page's heading, for search engines and screen readers: the map itself has none */}
      <h1 className="sr-only">Homestays across India on the map</h1>
      <ExploreClient
        homestays={homestays}
      />
    </>
  )
}
