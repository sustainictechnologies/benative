import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PreviewClient, { type PreviewLaunchInfo } from './PreviewClient'
import { isLive } from '@/lib/launchLinks'
import type { Metadata } from 'next'
import { NO_INDEX, pageMetadata } from '@/lib/site'
import { sharePreviewImgUrl } from '@/lib/supabase/imageUrl'

export const dynamic = 'force-dynamic'
// Read the preview fresh on every visit: without this, Next keeps the first database answer
// (the link stays the same when the preview is made again, so it would show old photos)
export const revalidate = 0

interface Props {
  params: { token: string }
}

// Read on the server with the private key, so the database does not have to let
// everyone list all previews (they hold draft content, contact details included).
// Cached so the share card and the page share one database read per visit.
const getPreview = cache(async (token: string) => {
  const { data } = await createAdminClient()
    .from('homestay_previews')
    .select('slug, blocks_data, page_meta, expires_at')
    .eq('token', token)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any
})

// The card shown when the link is shared (WhatsApp and others): the homestay's name, its village and district
// (as on the live page, not the full address) and its cover photo, else the first gallery photo, else the
// BeNative card. A host's private link: never in search results.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPreview(params.token)
  const name = String(data?.page_meta?.title ?? '').trim()
  if (!name) return { title: 'Homestay Preview · BeNative', robots: NO_INDEX }

  const [village = '', district = ''] = String(data.page_meta.address ?? '').split(',').map((s: string) => s.trim())
  const place = [village, district.toLowerCase() === village.toLowerCase() ? '' : district].filter(Boolean).join(', ')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = data.blocks_data ?? []
  const photo = [
    blocks.find(b => b.type === 'hero')?.content_data?.cover_image_url,
    blocks.find(b => b.type === 'gallery')?.content_data?.items?.find((item: any) => item?.url)?.url,
  ].find((url): url is string => typeof url === 'string' && url.startsWith('http'))

  return {
    ...pageMetadata({
      title:       `${name} · Preview · BeNative`,
      description: `${name}${place ? ` in ${place}` : ''}: a preview of its page on BeNative.`,
      path:        `/preview/${params.token}`,
      image:       photo ? { url: sharePreviewImgUrl(photo), alt: name } : undefined,
    }),
    robots: NO_INDEX,
  }
}

export default async function PreviewPage({ params }: Props) {
  const supabase = createAdminClient()
  const data     = await getPreview(params.token)

  if (!data) notFound()

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold text-stone-900">Preview Link Expired</h1>
          <p className="text-sm text-stone-500">This preview link was valid for 4 days. Ask the host to generate a new one.</p>
        </div>
      </div>
    )
  }

  // A new homestay's preview comes with its launch (made with the preview, see savePreview):
  // the host ticks that everything is correct and launches from here
  let launch: PreviewLaunchInfo = null
  if (data.slug) {
    const { data: link } = await supabase
      .from('homestay_launches')
      .select('token, expires_at, launched_at, live_slug')
      .eq('draft_slug', data.slug)
      .maybeSingle()
    // Launched: the "live" box only while it is on the site (Delete in Admin → Homestays takes it off again)
    if (link?.launched_at)                                launch = link.live_slug && await isLive(link.live_slug) ? { liveSlug: link.live_slug } : null
    else if (link && new Date(link.expires_at) > new Date()) launch = { href: `/launch/${link.token}` }
  }

  return (
    <PreviewClient
      blocksData={data.blocks_data}
      pageMeta={data.page_meta}
      launch={launch}
    />
  )
}
