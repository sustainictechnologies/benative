import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import ReviewSection from '@/components/reviews/ReviewSection'
import ShareButton from '@/components/ShareButton'
import type { HomestayBlock } from '@/types/blocks.types'
import { SUB_CATEGORY_GROUPS } from '@/lib/subCategories'
import { sharePreviewImgUrl } from '@/lib/supabase/imageUrl'
import { MapPin, Globe2, Clock, Eye } from 'lucide-react'
import type { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import { pageMetadata, SITE_URL } from '@/lib/site'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

const SUB_CATEGORY_LABELS = new Map(
  SUB_CATEGORY_GROUPS.flatMap((group) => group.subCategories.map((sub) => [sub.key, sub.label] as [string, string])),
)

// Cached so generateMetadata and the page share one DB round-trip per request.
// The host's phone number is not part of it: signed-out visitors cannot read it (see the page below).
const getHomestay = cache(async (slug: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, village_name, location_district, is_verified,
      host_name, calling_window, languages_spoken, youtube_video_id,
      created_at, updated_at, sub_categories, cover_image_url, latitude,
      homestay_tags ( tags ( id, name, slug ) ),
      homestay_blocks ( id, block_type, sort_order, content_data )
    `)
    .eq('slug', slug)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any
})

// The photo on a shared link's preview card: the cover, or the first gallery photo without one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function previewPhoto(data: any): string | null {
  const gallery = (data.homestay_blocks ?? []).find((b: any) => b.block_type === 'gallery')?.content_data
  return data.cover_image_url ?? gallery?.items?.find((item: any) => item?.url)?.url ?? gallery?.images?.find(Boolean) ?? null
}

// "Village, District" — once only when both are the same. The state is not among the public
// fields of a homestay (it is only inside the private address), so it is not shown here.
function placeName(data: { village_name?: string | null; location_district?: string | null }): string {
  const village  = (data.village_name ?? '').trim()
  const district = (data.location_district ?? '').trim()
  return [village, district.toLowerCase() === village.toLowerCase() ? '' : district].filter(Boolean).join(', ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getHomestay(params.slug)
  // A draft (latitude 0) has no public page
  if (!data || data.latitude === 0) return { robots: { index: false, follow: false } }

  const place = placeName(data)
  const title = place ? `${data.title}, ${place} | BeNative` : `${data.title} | BeNative`
  const description = `${data.title} is a homestay in ${place || 'India'}. See photos, rooms, food and local experiences, and connect directly with the host through BeNative.`
  const photo = previewPhoto(data)

  return pageMetadata({
    title,
    description,
    path: `/homestays/${data.slug}`,
    image: photo ? { url: sharePreviewImgUrl(photo), alt: place ? `${data.title}, ${place}` : data.title } : undefined,
  })
}

export default async function HomestayPage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // The views count is fetched alongside the homestay. Robots are not counted (supabase/homestay_view_count.sql);
  // until that file has been run, the count is left out.
  const [homestay, { data: views }] = await Promise.all([
    getHomestay(params.slug),
    supabase.rpc('homestay_view_count', { p_slug: params.slug }),
  ])

  if (!homestay || homestay.latitude === 0) notFound()

  // The host's phone number is fetched for signed-in visitors only
  let contactPhone = ''
  if (isLoggedIn) {
    const { data } = await supabase.from('homestays').select('contact_phone').eq('id', homestay.id).single()
    contactPhone = data?.contact_phone ?? ''
  }

  const categories: { id: number; name: string; slug: string }[] = (
    homestay.homestay_tags ?? []
  ).map((ht: any) => ht.tags).filter(Boolean)

  // The Tags block shows the Discover sub-categories and the facility (spec_*) tags; the older category tags are left out
  const tags = {
    subCategories: ((homestay.sub_categories ?? []) as string[])
      .map((key) => SUB_CATEGORY_LABELS.get(key))
      .filter((label): label is string => !!label),
    facilities: categories.filter((c) => c.slug.startsWith('spec_')).map((c) => c.name),
  }

  const blocks: HomestayBlock[] = (homestay.homestay_blocks ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)

  // The host is whoever signs in with the email saved in the homestay's contact block, once the sign-in
  // has confirmed that email. This only changes the Share message: it gives no other access.
  const hostEmail = ((blocks.find((b) => b.block_type === 'contact')?.content_data as any)?.email ?? '').trim().toLowerCase()
  const isHost = !!hostEmail && !!user?.email_confirmed_at && user.email?.toLowerCase() === hostEmail

  const meta = {
    host_name: homestay.host_name,
    contact_phone: contactPhone,
    calling_window: homestay.calling_window,
    youtube_video_id: homestay.youtube_video_id ?? null,
    title: homestay.title,
    tags,
  }

  // The first photo gallery with photos opens the page, and the hero then shows its text without its cover photo.
  // A homestay without gallery photos keeps its cover photo and the order set in the builder.
  const gallery = blocks.find((b) => {
    const d = b.content_data as any
    return b.block_type === 'gallery' && d?.hidden !== true &&
      ((d?.items ?? []).some((item: any) => item?.url) || (d?.images ?? []).some(Boolean))
  })
  let orderedBlocks = gallery ? [gallery, ...blocks.filter((b) => b !== gallery)] : blocks

  // The tags appear where the builder's Tags block is placed. Without one, right below the gallery
  // (or first, when there is no gallery).
  if (!blocks.some((b) => b.block_type === 'tags')) {
    const tagsBlock: HomestayBlock = { id: 'tags-default', homestay_id: homestay.id, sort_order: 0, block_type: 'tags', content_data: {} }
    orderedBlocks = gallery
      ? [orderedBlocks[0], tagsBlock, ...orderedBlocks.slice(1)]
      : [tagsBlock, ...orderedBlocks]
  }

  // Visitors without an account see the whole page; only the host's contact details need one.
  // The database does not give them the contact block, so its sign-in box takes its place (last, where it is on every page).
  if (!isLoggedIn && !orderedBlocks.some((b) => b.block_type === 'contact')) {
    const signInBlock: HomestayBlock = { id: 'contact-sign-in', homestay_id: homestay.id, sort_order: 0, block_type: 'contact', content_data: { host_name: homestay.host_name } }
    orderedBlocks = [...orderedBlocks, signInBlock]
  }

  // Where the page sits in the site, for search results: Home › Discover › this homestay
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Discover', item: `${SITE_URL}/discover` },
      { '@type': 'ListItem', position: 3, name: homestay.title, item: `${SITE_URL}/homestays/${homestay.slug}` },
    ],
  }

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-2">
      <JsonLd data={breadcrumbs} />
      {/* Header */}
      <div className="mb-5">
        {/* The tags have their own block, below the gallery unless placed elsewhere in the builder */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-3xl font-bold text-stone-900 min-w-0">{homestay.title}</h1>
          <ShareButton
            title={homestay.title}
            place={`${homestay.village_name}, ${homestay.location_district}`}
            slug={params.slug}
            isHost={isHost}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {homestay.village_name}, {homestay.location_district}
          </span>
          {(homestay.languages_spoken ?? []).length > 0 && (
            <span className="flex items-center gap-1.5">
              <Globe2 size={14} />
              {(homestay.languages_spoken as string[]).join(', ')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 mt-2">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Listed {new Date(homestay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {homestay.updated_at && homestay.updated_at !== homestay.created_at && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              Updated {new Date(homestay.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          {typeof views === 'number' && (
            <span className="flex items-center gap-1.5">
              <Eye size={12} />
              {views.toLocaleString('en-IN')} {views === 1 ? 'view' : 'views'}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic blocks — the photo gallery always comes first */}
      <div className="space-y-6">
        {orderedBlocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            isLoggedIn={isLoggedIn}
            slug={params.slug}
            homestay={meta}
            hideHeroCover={!!gallery}
          />
        ))}
      </div>

      {/* Reviews */}
      <div className="pt-8 border-t border-stone-200 mt-10">
        <ReviewSection homestayId={homestay.id} slug={params.slug} />
      </div>
    </article>
  )
}