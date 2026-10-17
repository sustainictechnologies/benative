import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import ReviewSection from '@/components/reviews/ReviewSection'
import SignupGate from '@/components/SignupGate'
import type { HomestayBlock } from '@/types/blocks.types'
import { SUB_CATEGORY_GROUPS } from '@/lib/subCategories'
import { MapPin, Globe2, Clock } from 'lucide-react'

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
      created_at, updated_at, sub_categories,
      homestay_tags ( tags ( id, name, slug ) ),
      homestay_blocks ( id, block_type, sort_order, content_data )
    `)
    .eq('slug', slug)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any
})

export async function generateMetadata({ params }: Props) {
  const data = await getHomestay(params.slug)
  if (!data) return {}
  return {
    title: `${data.title} · BeNative`,
    description: `Authentic homestay in ${data.village_name}, ${data.location_district}. Direct host contact via BeNative.`,
  }
}

export default async function HomestayPage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const homestay = await getHomestay(params.slug)

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

  const meta = {
    host_name: homestay.host_name,
    contact_phone: contactPhone,
    calling_window: homestay.calling_window,
    youtube_video_id: homestay.youtube_video_id ?? null,
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

  // A visitor without an account gets the page blurred, cut short and out of reach, under a sign-in pop-up.
  // React 18 only sets `inert` when it is given as an empty string, which its types do not allow, hence `object`.
  const lockedProps: object = isLoggedIn ? {} : { 'aria-hidden': true, inert: '' }

  return (
    <>
    <article
      className={`max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-2 ${
        isLoggedIn ? '' : 'blur-[6px] pointer-events-none select-none max-h-[160vh] overflow-hidden'
      }`}
      {...lockedProps}
    >
      {/* Header */}
      <div className="mb-5">
        {/* The tags have their own block, below the gallery unless placed elsewhere in the builder */}
        <h1 className="text-3xl font-bold text-stone-900 mb-2">{homestay.title}</h1>

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

    {!isLoggedIn && <SignupGate slug={params.slug} />}
    </>
  )
}