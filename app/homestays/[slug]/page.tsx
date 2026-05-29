import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import ReviewSection from '@/components/reviews/ReviewSection'
import type { HomestayBlock } from '@/types/blocks.types'
import { MapPin, Globe2, ShieldCheck } from 'lucide-react'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: raw } = await supabase
    .from('homestays')
    .select('title, village_name, location_district')
    .eq('slug', params.slug)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any
  if (!data) return {}
  return {
    title: `${data.title} · Be Native`,
    description: `Authentic homestay in ${data.village_name}, ${data.location_district}. Direct host contact via Be Native.`,
  }
}

export default async function HomestayPage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const { data: raw } = await supabase
    .from('homestays')
    .select(`
      *,
      homestay_categories ( categories ( id, name, slug ) ),
      homestay_blocks ( id, block_type, sort_order, content_data )
    `)
    .eq('slug', params.slug)
    .single()

  // Cast once — Supabase infers `never` for complex join selects without generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homestay = raw as any

  if (!homestay) notFound()

  const categories: { id: number; name: string; slug: string }[] = (
    homestay.homestay_categories ?? []
  ).map((hc: any) => hc.categories).filter(Boolean)

  const blocks: HomestayBlock[] = (homestay.homestay_blocks ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-2">
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
      </div>

      {/* Dynamic blocks */}
      <div className="space-y-6">
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            isLoggedIn={isLoggedIn}
            slug={params.slug}
            homestay={{
              host_name: homestay.host_name,
              contact_phone: homestay.contact_phone,
              calling_window: homestay.calling_window,
              youtube_video_id: homestay.youtube_video_id ?? null,
            }}
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