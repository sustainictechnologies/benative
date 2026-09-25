import DiscoverClient from '@/components/discover/DiscoverClient'

export const metadata = {
  title: 'Discover Homestays · BeNative',
  description: 'Find authentic homestays across India filtered by travel intent, landscape, and practical requirements.',
}

export default function DiscoverPage({ searchParams }: { searchParams: { intent?: string; cat?: string } }) {
  return <DiscoverClient initialIntentSlug={searchParams.intent} initialCatKey={searchParams.cat} />
}
