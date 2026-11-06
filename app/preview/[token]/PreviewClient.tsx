'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, MapPin, Languages, Rocket, Home, ArrowRight, Check } from 'lucide-react'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { HomestayBlock } from '@/types/blocks.types'

// The launch that comes with a new homestay's preview: ready (its launch page), already used
// (the live page), or none (an earlier preview, or a live homestay's changes)
export type PreviewLaunchInfo = { token: string } | { liveSlug: string | null } | null

interface BlockData {
  type: string
  content_data: Record<string, unknown>
}

interface PageMeta {
  title:     string
  address:   string
  languages: string[]
}

interface Props {
  blocksData: BlockData[]
  pageMeta?:  PageMeta | null
  launch?:    PreviewLaunchInfo
}

export default function PreviewClient({ blocksData, pageMeta, launch = null }: Props) {
  const router              = useRouter()
  const [checked, setChecked] = useState(false)
  const canLaunch = !!launch && 'token' in launch
  const isLive    = !!launch && 'liveSlug' in launch

  const blocks = blocksData.map((b, i) => ({
    id:           `preview-${i}`,
    homestay_id:  'preview',
    sort_order:   i,
    block_type:   b.type,
    content_data: b.content_data,
  })) as HomestayBlock[]

  // As on the published page: with a photo gallery, the hero shows its text without its cover photo
  const hasGallery = blocks.some(b => {
    const d = b.content_data as any
    return b.block_type === 'gallery' && d?.hidden !== true &&
      ((d?.items ?? []).some((item: any) => item?.url) || (d?.images ?? []).some(Boolean))
  })

  const contactData = (blocksData.find(b => b.type === 'contact')?.content_data ?? {}) as Record<string, string>
  const homestay = {
    host_name:        contactData.host_name      ?? '',
    contact_phone:    contactData.phone          ?? '',
    calling_window:   contactData.calling_window ?? '',
    youtube_video_id: null,
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Preview banner */}
      <div className={`sticky top-0 z-50 ${isLive ? 'bg-emerald-600' : 'bg-amber-500'} text-white text-center py-2.5 px-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 shadow-md`}>
        <Eye size={14} />
        {isLive ? (
          <span className="text-sm font-semibold">This homestay is now live on BeNative</span>
        ) : (
          <span className="text-sm font-semibold">Preview — this page has not been published yet</span>
        )}
        {canLaunch && (
          <a href="#launch" className="text-sm font-semibold underline underline-offset-2 hover:text-amber-50">Looks good? Launch it ↓</a>
        )}
      </div>

      {/* Homestay meta header */}
      {pageMeta?.title && (
        <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-lg font-bold text-stone-900">{pageMeta.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {pageMeta.address && (
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <MapPin size={11} className="text-stone-400" /> {pageMeta.address}
              </span>
            )}
            {pageMeta.languages?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Languages size={11} className="text-stone-400" /> {pageMeta.languages.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {blocks.map(block => (
          <BlockRenderer
            key={block.id}
            block={block}
            homestay={homestay}
            isLoggedIn={true}
            slug="preview"
            hideHeroCover={hasGallery}
          />
        ))}
      </div>

      {/* The host's go-ahead: after reading the whole page, tick and launch */}
      {launch && 'token' in launch && (
        <section id="launch" className="scroll-mt-32 px-4 sm:px-6 pt-4 pb-16">
          <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-3xl shadow-sm px-6 py-7 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">
              <Rocket size={22} />
            </div>
            <h2 className="mt-3 text-xl font-bold text-stone-900">Happy with your page?</h2>
            <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
              Check every section above. When everything is right, launch your homestay on BeNative yourself.
            </p>
            <label className="mt-5 flex items-start gap-3 text-left bg-stone-50 border border-stone-200 hover:border-brand-300 rounded-2xl px-4 py-3.5 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                className="mt-0.5 w-5 h-5 shrink-0 accent-brand-700 cursor-pointer"
              />
              <span className="text-sm text-stone-700 leading-snug">I&apos;ve checked my homestay page and everything is correct.</span>
            </label>
            <button
              type="button"
              disabled={!checked}
              onClick={() => router.push(`/launch/${launch.token}`)}
              className="mt-4 w-full min-h-[56px] flex items-center justify-center gap-2.5 rounded-2xl bg-brand-700 hover:bg-brand-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors shadow-sm"
            >
              <Home size={18} /> Launch My Homestay <ArrowRight size={18} />
            </button>
            {!checked && <p className="mt-2 text-xs text-stone-400">Tick the box above to launch.</p>}
            <p className="mt-4 text-xs text-stone-500">
              Something to change? <Link href="/contact" target="_blank" className="underline underline-offset-2 hover:text-stone-700">Message us</Link> and we&apos;ll update it before you launch.
            </p>
          </div>
        </section>
      )}
      {launch && 'liveSlug' in launch && launch.liveSlug && (
        <section className="px-4 sm:px-6 pt-4 pb-16">
          <div className="max-w-xl mx-auto bg-white border border-emerald-200 rounded-3xl shadow-sm px-6 py-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check size={22} />
            </div>
            <h2 className="mt-3 text-xl font-bold text-stone-900">Your homestay is live on BeNative</h2>
            <Link
              href={`/homestays/${launch.liveSlug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-3 transition-colors"
            >
              View My Homestay <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
