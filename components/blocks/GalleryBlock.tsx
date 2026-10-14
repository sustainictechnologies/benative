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

// The first photo large across the block, whatever shape (ratio) was picked in the builder; the next ones in a
// single row of small photos below: six on a computer, four on a phone, with "+N" on the last one shown.
const SMALL_ON_COMPUTER = 6
const SMALL_ON_PHONE    = 4

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

  const rest         = photos.slice(1, 1 + SMALL_ON_COMPUTER)        // small photos (index in `photos` is i + 1)
  const hiddenPhone  = photos.length - 1 - SMALL_ON_PHONE           // photos after the last small one shown
  const hiddenDesk   = photos.length - 1 - SMALL_ON_COMPUTER

  return (
    <>
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={supabaseImgUrl(photos[0].url, { width: 1600, quality: 80 })}
          alt={`Gallery photo 1 of ${photos.length}`}
          onClick={() => setSelected(0)}
          className="w-full aspect-video object-cover cursor-pointer hover:opacity-95 transition-opacity"
        />

        {rest.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-0.5 mt-0.5">
            {rest.map((photo, i) => {
              const onPhone   = i < SMALL_ON_PHONE
              const lastPhone = i === SMALL_ON_PHONE - 1 && hiddenPhone > 0
              const lastDesk  = i === SMALL_ON_COMPUTER - 1 && hiddenDesk > 0
              return (
                <div key={i} className={`relative aspect-[4/3] ${onPhone ? '' : 'hidden sm:block'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supabaseImgUrl(photo.url, { width: 400, quality: 70 })}
                    alt={`Gallery photo ${i + 2} of ${photos.length}`}
                    loading="lazy"
                    onClick={() => setSelected(i + 1)}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  {lastPhone && (
                    <button
                      type="button"
                      onClick={() => setSelected(i + 2)}
                      className="sm:hidden absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-0.5 text-white"
                    >
                      <span className="text-lg font-bold">+{hiddenPhone}</span>
                      <span className="text-[10px] font-medium text-white/80">more photos</span>
                    </button>
                  )}
                  {lastDesk && (
                    <button
                      type="button"
                      onClick={() => setSelected(i + 2)}
                      className="hidden sm:flex absolute inset-0 bg-black/55 flex-col items-center justify-center gap-1 text-white"
                    >
                      <span className="text-2xl font-bold">+{hiddenDesk}</span>
                      <span className="text-xs font-medium text-white/80">more photos</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
