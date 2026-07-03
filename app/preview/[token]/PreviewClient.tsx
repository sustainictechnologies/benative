'use client'

import { Eye, MapPin, Languages } from 'lucide-react'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { HomestayBlock } from '@/types/blocks.types'

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
}

export default function PreviewClient({ blocksData, pageMeta }: Props) {
  const blocks = blocksData.map((b, i) => ({
    id:           `preview-${i}`,
    homestay_id:  'preview',
    sort_order:   i,
    block_type:   b.type,
    content_data: b.content_data,
  })) as HomestayBlock[]

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
      <div className="sticky top-0 z-50 bg-amber-500 text-white text-center py-2.5 px-4 flex items-center justify-center gap-2 shadow-md">
        <Eye size={14} />
        <span className="text-sm font-semibold">Preview — this page has not been published yet</span>
      </div>

      {/* Homestay meta header */}
      {pageMeta?.title && (
        <div className="bg-white border-b border-stone-100 px-4 py-4 max-w-2xl mx-auto">
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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {blocks.map(block => (
          <BlockRenderer
            key={block.id}
            block={block}
            homestay={homestay}
            isLoggedIn={true}
            slug="preview"
          />
        ))}
      </div>
    </div>
  )
}
