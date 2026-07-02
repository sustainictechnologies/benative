'use client'

import { Eye } from 'lucide-react'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { HomestayBlock } from '@/types/blocks.types'

interface BlockData {
  type: string
  content_data: Record<string, unknown>
}

interface Props {
  blocksData: BlockData[]
}

export default function PreviewClient({ blocksData }: Props) {
  const blocks = blocksData.map((b, i) => ({
    id:           `preview-${i}`,
    homestay_id:  'preview',
    sort_order:   i,
    block_type:   b.type,
    content_data: b.content_data,
  })) as HomestayBlock[]

  const contactData = (blocksData.find(b => b.type === 'contact')?.content_data ?? {}) as Record<string, string>
  const homestay = {
    host_name:        contactData.host_name     ?? '',
    contact_phone:    contactData.phone         ?? '',
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
