'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

type Ratio = 'square' | 'landscape' | 'portrait'

interface GalleryItem { url: string; ratio?: Ratio }

interface Props {
  data: {
    items?:  GalleryItem[]
    images?: (string | null)[]
  }
}

const RATIO_CLASS: Record<string, string> = {
  square:    'aspect-square',
  landscape: 'aspect-video',
  portrait:  'aspect-[3/4]',
}

const VISIBLE_LIMIT = 6

export default function GalleryBlock({ data }: Props) {
  const photos: GalleryItem[] = data.items
    ? data.items.filter(i => i?.url)
    : (data.images ?? []).filter(Boolean).map(url => ({ url: url as string, ratio: 'square' as Ratio }))

  const [selected, setSelected] = useState<number | null>(null)

  const close = () => setSelected(null)
  const prev  = useCallback(() => setSelected(i => i !== null ? (i - 1 + photos.length) % photos.length : null), [photos.length])
  const next  = useCallback(() => setSelected(i => i !== null ? (i + 1) % photos.length : null), [photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (selected === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, next, prev])

  if (photos.length === 0) return null

  // Count by grid cells (landscape = 3 cols, others = 1) so cut is always at exactly 2 rows
  let cellCount = 0
  let visibleCount = photos.length
  for (let i = 0; i < photos.length; i++) {
    const cells = (photos[i].ratio ?? 'square') === 'landscape' ? 3 : 1
    if (cellCount + cells > VISIBLE_LIMIT) { visibleCount = i; break }
    cellCount += cells
  }

  const visiblePhotos   = photos.slice(0, visibleCount)
  const hiddenCount     = photos.length - visibleCount
  const showPlusOverlay = hiddenCount > 0

  return (
    <>
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="grid grid-cols-3 gap-px items-start grid-flow-row-dense">
          {visiblePhotos.map((photo, i) => {
            const ratio = photo.ratio ?? 'square'
            const isLastVisible = i === visiblePhotos.length - 1 && showPlusOverlay
            return (
              <div
                key={i}
                className={`relative ${ratio === 'landscape' ? 'col-span-3' : 'col-span-1'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={supabaseImgUrl(photo.url, { width: 800, quality: 75 })}
                  alt={`Gallery photo ${i + 1}`}
                  onClick={() => setSelected(i)}
                  className={`w-full object-cover cursor-pointer hover:opacity-90 transition-opacity ${RATIO_CLASS[ratio]}`}
                />
                {isLastVisible && (
                  <div
                    onClick={() => setSelected(visibleCount)}
                    className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center cursor-pointer gap-1"
                  >
                    <span className="text-white text-2xl font-bold">+{hiddenCount}</span>
                    <span className="text-white/80 text-xs font-medium">more photos</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {selected + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={supabaseImgUrl(photos[selected].url, { width: 1600, quality: 85, resize: 'contain' })}
            alt={`Gallery photo ${selected + 1}`}
            onClick={e => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
