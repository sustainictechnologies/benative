import { pageMetadata } from '@/lib/site'
import DiscoverClient from '@/components/discover/DiscoverClient'
import { createClient } from '@/lib/supabase/server'
import { INDIA, toDiscoverCard } from '@/lib/discoverStays'
import type { HomestayWithCategories } from '@/types/blocks.types'

export const metadata = pageMetadata({
  title: 'Discover Homestays · BeNative',
  description: 'Find authentic homestays across India filtered by travel intent, landscape, and practical requirements.',
  path: '/discover',
})

async function getImageMap(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase.from('homepage_images').select('slot, image_url')
  if (!data) return {}
  return Object.fromEntries(data.filter(r => r.image_url).map(r => [r.slot, r.image_url as string]))
}

// The stays across India, nothing filtered (the same list the page asks for in the browser), so the page
// arrives with its homestay cards and links: shown at once, and seen by search engines
async function getStays(): Promise<HomestayWithCategories[] | undefined> {
  const { data, error } = await createClient().rpc('discover_homestays', {
    min_lat: INDIA.south, max_lat: INDIA.north, min_lng: INDIA.west, max_lng: INDIA.east,
    sub_category: null, practical_slugs: [],
  })
  if (error || !data) return undefined   // the page then loads them in the browser, as before
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).filter(h => h.latitude !== 0 || h.longitude !== 0).map(toDiscoverCard)
}

export default async function DiscoverPage({ searchParams }: { searchParams: { intent?: string; cat?: string; q?: string } }) {
  // A search (?q=) shows only its matches, found in the browser: no unfiltered list with the page
  const [imageMap, stays] = await Promise.all([getImageMap(), searchParams.q ? undefined : getStays()])
  return (
    <DiscoverClient
      initialIntentSlug={searchParams.intent}
      initialCatKey={searchParams.cat}
      initialSearch={searchParams.q}
      imageMap={imageMap}
      initialHomestays={stays}
    />
  )
}
