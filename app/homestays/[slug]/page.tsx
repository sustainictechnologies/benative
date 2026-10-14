import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import ReviewSection from '@/components/reviews/ReviewSection'
import SignupGate from '@/components/SignupGate'
import type { HomestayBlock } from '@/types/blocks.types'
import { MapPin, Globe2, ShieldCheck, Clock } from 'lucide-react'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

// Cached so generateMetadata and the page share one DB round-trip per request
const getHomestay = cache(async (slug: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, village_name, location_district, is_verified,
      host_name, contact_phone, calling_window, languages_spoken,
      address, whatsapp_number, email, youtube_video_id,
      created_at, updated_at,
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

  const categories: { id: number; name: string; slug: string }[] = (
    homestay.homestay_tags ?? []
  ).map((ht: any) => ht.tags).filter(Boolean)

  const blocks: HomestayBlock[] = (homestay.homestay_blocks ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)

  const meta = {
    host_name: homestay.host_name,
    contact_phone: homestay.contact_phone,
    calling_window: homestay.calling_window,
    youtube_video_id: homestay.youtube_video_id ?? null,
  }

  // The first photo gallery with photos opens the page, and the hero then shows its text without its cover photo.
  // A homestay without gallery photos keeps its cover photo and the order set in the builder.
  const gallery = blocks.find((b) => {
    const d = b.content_data as any
    return b.block_type === 'gallery' && d?.hidden !== true &&
      ((d?.items ?? []).some((item: any) => item?.url) || (d?.images ?? []).some(Boolean))
  })
  const orderedBlocks = gallery ? [gallery, ...blocks.filter((b) => b !== gallery)] : blocks

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
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {homestay.is_verified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} /> Verified Host
            </span>
          )}
          {categories.map((c) => (
            <span
              key={c.id}
              className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full"
            >
              {c.name}
            </span>
          ))}
        </div>

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