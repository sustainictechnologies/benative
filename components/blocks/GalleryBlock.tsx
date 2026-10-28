'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Swipe in the photo viewer (phones): left/right for the next/previous photo, down to close.
  // The photo follows the finger; a short swipe springs back.
  const touch = useRef<{ x: number; y: number; axis: 'x' | 'y' | null } | null>(null)
  const [drag, setDrag]         = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)   // no animation while the finger is down

  const viewerUrl = (url: string) => supabaseImgUrl(url, { width: 1600, quality: 85, resize: 'contain' })

  // The photos either side load in the background, so a swipe shows them straight away
  useEffect(() => {
    if (selected === null || photos.length < 2) return
    for (const i of [selected + 1, selected - 1 + photos.length]) new Image().src = viewerUrl(photos[i % photos.length].url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, photos.length])

  const resetDrag = () => { touch.current = null; setDragging(false); setDrag({ x: 0, y: 0 }) }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return resetDrag()   // two fingers: leave pinch-zoom to the browser
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null }
    setDragging(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const t = touch.current
    if (!t) return
    if (e.touches.length !== 1) return resetDrag()
    const dx = e.touches[0].clientX - t.x
    const dy = e.touches[0].clientY - t.y
    if (!t.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      t.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    // Sideways with a single photo: only a little give, nothing to go to
    setDrag(t.axis === 'x' ? { x: photos.length > 1 ? dx : dx / 4, y: 0 } : { x: 0, y: Math.max(0, dy) })
  }
  const onTouchEnd = () => {
    const axis = touch.current?.axis
    if (axis === 'x' && photos.length > 1 && Math.abs(drag.x) > 60) {
      const dir = drag.x < 0 ? 1 : -1
      if (dir > 0) next(); else prev()
      // The new photo starts a little to the side it comes from, then slides into place
      touch.current = null
      setDrag({ x: dir * window.innerWidth * 0.3, y: 0 })
      requestAnimationFrame(() => requestAnimationFrame(() => { setDragging(false); setDrag({ x: 0, y: 0 }) }))
      return
    }
    if (axis === 'y' && drag.y > 100) close()
    resetDrag()
  }

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
          className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center touch-pinch-zoom"
          // While pulling the photo down, the dark background fades
          style={drag.y ? { backgroundColor: `rgb(0 0 0 / ${0.9 - Math.min(drag.y / 500, 0.5)})` } : undefined}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={resetDrag}
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
              className="absolute left-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewerUrl(photos[selected].url)}
            alt={`Gallery photo ${selected + 1}`}
            onClick={e => e.stopPropagation()}
            draggable={false}
            style={{ transform: `translate(${drag.x}px, ${drag.y}px)`, transition: dragging ? 'none' : 'transform 200ms ease-out' }}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl select-none"
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
