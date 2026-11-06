import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import PreviewClient from '@/app/preview/[token]/PreviewClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// A demo of a host's preview page, to send to anyone (and for how-to videos): a live homestay's page as a
// preview, ending with the tick box and Launch button, which opens the demo launch page. Nothing is saved
// or published. Live homestays only, and without the host's contact details: the contact section shows
// its sign-in box, as on the homestay page for signed-out visitors.
export default async function PreviewDemoPage({ params }: { params: { slug: string } }) {
  const { data: homestay } = await createAdminClient()
    .from('homestays')
    .select('title, slug, village_name, location_district, languages_spoken, latitude, homestay_blocks ( block_type, sort_order, content_data )')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!homestay || homestay.latitude === 0) notFound()

  // The contact details never reach the browser: only the host's name stays
  const blocksData = [...(homestay.homestay_blocks ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(b => ({
      type:         b.block_type as string,
      content_data: b.block_type === 'contact'
        ? { host_name: (b.content_data as Record<string, unknown>)?.host_name ?? '' }
        : b.content_data as Record<string, unknown>,
    }))

  return (
    <PreviewClient
      blocksData={blocksData}
      pageMeta={{
        title:     homestay.title,
        address:   [homestay.village_name, homestay.location_district].filter(Boolean).join(', '),
        languages: homestay.languages_spoken ?? [],
      }}
      launch={{ href: `/launch/demo/${homestay.slug}` }}
      signedOut
      slug={homestay.slug}
    />
  )
}
