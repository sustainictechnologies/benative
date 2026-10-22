import DiscoverClient from '@/components/discover/DiscoverClient'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Discover Homestays · BeNative',
  description: 'Find authentic homestays across India filtered by travel intent, landscape, and practical requirements.',
}

async function getImageMap(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase.from('homepage_images').select('slot, image_url')
  if (!data) return {}
  return Object.fromEntries(data.filter(r => r.image_url).map(r => [r.slot, r.image_url as string]))
}

export default async function DiscoverPage({ searchParams }: { searchParams: { intent?: string; cat?: string } }) {
  const imageMap = await getImageMap()
  return <DiscoverClient initialIntentSlug={searchParams.intent} initialCatKey={searchParams.cat} imageMap={imageMap} />
}
