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

// Whatever shape (ratio) was picked in the builder:
// Phone: the first photo large, a row of up to four small photos below, "+N" on the last one shown.
// Computer: the first photo large with up to four small ones beside it, "+N" on the last one shown.
const SMALL_ON_PHONE    = 4
const SMALL_ON_COMPUTER = 4

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

  const phoneSmall  = photos.slice(1, 1 + SMALL_ON_PHONE)      // index in `photos` is i + 1
  const phoneHidden = photos.length - 1 - SMALL_ON_PHONE        // photos after the last small one shown
  const deskSmall   = photos.slice(1, 1 + SMALL_ON_COMPUTER)
  const deskHidden  = photos.length - 1 - SMALL_ON_COMPUTER
  // Two columns of small photos when there are three or four; with three, the last one runs along the bottom
  const deskColumns = deskSmall.length >= 3 ? 'grid-cols-[2fr_1fr_1fr]' : deskSmall.length > 0 ? 'grid-cols-[2fr_1fr]' : 'grid-cols-1'

  return (
    // One wrapper, so neither the hidden layout nor the lightbox picks up the page's spacing between blocks
    <div>
      {/* Phone */}
      <div className="sm:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={supabaseImgUrl(photos[0].url, { width: 1600, quality: 80 })}
          alt={`Gallery photo 1 of ${photos.length}`}
          onClick={() => setSelected(0)}
          className="w-full aspect-video object-cover rounded-lg cursor-pointer"
        />
        {phoneSmall.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
            {phoneSmall.map((photo, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={supabaseImgUrl(photo.url, { width: 400, quality: 70 })}
                  alt={`Gallery photo ${i + 2} of ${photos.length}`}
                  loading="lazy"
                  onClick={() => setSelected(i + 1)}
                  className="w-full h-full object-cover cursor-pointer"
                />
                {i === SMALL_ON_PHONE - 1 && phoneHidden > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected(i + 2)}
                    className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-0.5 text-white"
                  >
                    <span className="text-lg font-bold">+{phoneHidden}</span>
                    <span className="text-[10px] font-medium text-white/80">more photos</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Computer */}
      <div className="hidden sm:block">
        <div className={`grid gap-1.5 h-[420px] grid-rows-2 ${deskColumns}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={supabaseImgUrl(photos[0].url, { width: 1600, quality: 80 })}
            alt={`Gallery photo 1 of ${photos.length}`}
            onClick={() => setSelected(0)}
            className="w-full h-full row-span-2 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
          />
          {deskSmall.map((photo, i) => (
            <div
              key={i}
              className={`relative min-h-0 rounded-lg overflow-hidden ${
                deskSmall.length === 1 ? 'row-span-2' : deskSmall.length === 3 && i === 2 ? 'col-span-2' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={supabaseImgUrl(photo.url, { width: 600, quality: 75 })}
                alt={`Gallery photo ${i + 2} of ${photos.length}`}
                loading="lazy"
                onClick={() => setSelected(i + 1)}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
              {i === SMALL_ON_COMPUTER - 1 && deskHidden > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(i + 2)}
                  className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 text-white"
                >
                  <span className="text-2xl font-bold">+{deskHidden}</span>
                  <span className="text-xs font-medium text-white/80">more photos</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox — above the site header (z-[1000]), so the photo sits in the middle of the whole screen */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center"
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
    </div>
  )
}
