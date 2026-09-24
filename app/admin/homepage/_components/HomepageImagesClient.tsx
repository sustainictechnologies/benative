'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Trash2, CheckCircle, Loader2 } from 'lucide-react'
import { uploadHomepageImage, clearHomepageImage } from '../actions'

interface Slot { slot: string; label: string; section: string; image_url: string | null }
interface Props { slots: Slot[] }
type Status = 'idle' | 'uploading' | 'success' | 'error'

interface CropState {
  src: string
  file: File
  slot: string
  imgW: number
  imgH: number
  x: number
  y: number
  zoom: number
  dragging: boolean
}

function slotMeta(slot: string) {
  if (slot.startsWith('carousel_')) return { w: 1600, h: 580, aspect: '1600 / 580' }
  if (slot.startsWith('cat_'))      return { w: 600,  h: 800, aspect: '3 / 4' }
  return                                   { w: 600,  h: 400, aspect: '3 / 2' }
}

async function cropToBlob(
  src: string,
  crop: { x: number; y: number; zoom: number },
  tw: number,
  th: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = tw; canvas.height = th
      const ctx = canvas.getContext('2d')!
      const sw = img.naturalWidth  * crop.zoom
      const sh = img.naturalHeight * crop.zoom
      const ox = (crop.x / 100) * sw - tw / 2
      const oy = (crop.y / 100) * sh - th / 2
      ctx.drawImage(img, -ox, -oy, sw, sh)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas toBlob failed')), 'image/jpeg', 0.92)
    }
    img.onerror = reject
    img.src = src
  })
}

const SECTIONS = [
  { key: 'carousel',     title: 'Hero Carousel',   hint: '1600 × 580 px — landscape' },
  { key: 'categories',   title: 'Main Categories', hint: '600 × 800 px — portrait'   },
  { key: 'subcategories',title: 'Sub-Categories',  hint: '600 × 400 px — landscape'  },
]

export default function HomepageImagesClient({ slots }: Props) {
  const router = useRouter()

  const [images,   setImages]   = useState<Record<string, string | null>>(
    () => Object.fromEntries(slots.map(s => [s.slot, s.image_url]))
  )
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    () => Object.fromEntries(slots.map(s => [s.slot, 'idle' as Status]))
  )
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [crop,     setCrop]     = useState<CropState | null>(null)

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const dragRef  = useRef({ startMX: 0, startMY: 0, startX: 0, startY: 0 })

  function setStatus(slot: string, s: Status) { setStatuses(p => ({ ...p, [slot]: s })) }

  // ── File selected → get natural dims → open crop modal ─────────
  function onFileChange(slot: string, file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const src = e.target!.result as string
      const img = new Image()
      img.onload = () => setCrop({
        src, file, slot,
        imgW: img.naturalWidth,
        imgH: img.naturalHeight,
        x: 50, y: 50, zoom: 1, dragging: false,
      })
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // ── Crop modal: apply → canvas crop → upload ────────────────────
  async function handleApply() {
    if (!crop) return
    const { w, h } = slotMeta(crop.slot)
    const frozen = { ...crop }
    setCrop(null)
    setStatus(frozen.slot, 'uploading')
    try {
      const blob = await cropToBlob(frozen.src, frozen, w, h)
      const fd   = new FormData()
      fd.append('slot', frozen.slot)
      fd.append('file', new File([blob], `${frozen.slot}.jpg`, { type: 'image/jpeg' }))
      const res = await uploadHomepageImage(fd)
      if (res.error) {
        setErrors(p => ({ ...p, [frozen.slot]: res.error! }))
        setStatus(frozen.slot, 'error')
      } else {
        setImages(p => ({ ...p, [frozen.slot]: res.url! }))
        setStatus(frozen.slot, 'success')
        setTimeout(() => setStatus(frozen.slot, 'idle'), 2000)
        router.refresh()
      }
    } catch {
      setErrors(p => ({ ...p, [frozen.slot]: 'Upload failed — try again' }))
      setStatus(frozen.slot, 'error')
    }
  }

  async function handleClear(slot: string) {
    setStatus(slot, 'uploading')
    const res = await clearHomepageImage(slot)
    if (res.error) {
      setErrors(p => ({ ...p, [slot]: res.error! }))
      setStatus(slot, 'error')
    } else {
      setImages(p => ({ ...p, [slot]: null }))
      setStatus(slot, 'idle')
      router.refresh()
    }
  }

  // ── Crop modal drag ─────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!crop) return
    e.preventDefault()
    dragRef.current = { startMX: e.clientX, startMY: e.clientY, startX: crop.x, startY: crop.y }
    setCrop(p => p ? { ...p, dragging: true } : p)
  }, [crop])

  useEffect(() => {
    if (!crop?.dragging) return
    const sensitivity = 2.5 * (crop.zoom ?? 1)
    const onMove = (e: MouseEvent) => {
      const nx = Math.min(100, Math.max(0, dragRef.current.startX - (e.clientX - dragRef.current.startMX) / sensitivity))
      const ny = Math.min(100, Math.max(0, dragRef.current.startY - (e.clientY - dragRef.current.startMY) / sensitivity))
      setCrop(p => p ? { ...p, x: nx, y: ny } : p)
    }
    const onUp = () => setCrop(p => p ? { ...p, dragging: false } : p)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [crop?.dragging, crop?.zoom])

  return (
    <>
      {/* ── Crop modal ── */}
      {crop && (() => {
        const meta = slotMeta(crop.slot)
        return (
          <div
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setCrop(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Crop & Position</h2>
                  <p className="text-[11px] text-stone-400 mt-0.5">Drag to reposition · Scroll to zoom</p>
                </div>
                <button
                  onClick={() => setCrop(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Preview frame — correct aspect ratio for this slot */}
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-stone-100 ring-2 ring-stone-200 select-none"
                  style={{
                    aspectRatio: meta.aspect,
                    cursor: crop.dragging ? 'grabbing' : 'grab',
                  }}
                  onMouseDown={onMouseDown}
                  onWheel={e => {
                    e.preventDefault()
                    setCrop(p => p ? { ...p, zoom: Math.min(3, Math.max(1, p.zoom + (e.deltaY < 0 ? 0.1 : -0.1))) } : p)
                  }}
                >
                  {/* Preview mirrors canvas math exactly:
                      image drawn at (imgW*zoom × imgH*zoom) offset so
                      (x%,y%) of scaled image lands at center of frame */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crop.src}
                    alt="crop preview"
                    draggable={false}
                    className="absolute pointer-events-none"
                    style={{
                      width:  `${crop.imgW * crop.zoom / meta.w * 100}%`,
                      height: `${crop.imgH * crop.zoom / meta.h * 100}%`,
                      left:   `${(0.5 - (crop.x / 100) * crop.imgW * crop.zoom / meta.w) * 100}%`,
                      top:    `${(0.5 - (crop.y / 100) * crop.imgH * crop.zoom / meta.h) * 100}%`,
                      transition: crop.dragging ? 'none' : 'left 0.05s, top 0.05s',
                    }}
                  />
                </div>

                {/* Zoom */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Zoom</p>
                    <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                      {crop.zoom.toFixed(1)}×
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="3" step="0.05" value={crop.zoom}
                    onChange={e => setCrop(p => p ? { ...p, zoom: parseFloat(e.target.value) } : p)}
                    className="w-full h-1.5 rounded-full accent-brand-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone-300 mt-1">
                    <span>1×</span><span>3×</span>
                  </div>
                </div>

                {/* Target size hint */}
                <p className="text-[10px] text-stone-400 text-center">
                  Saves as {meta.w} × {meta.h} px
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCrop(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-[2] py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle size={13} /> Apply & Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Slot grid ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10">
        {SECTIONS.map(sec => {
          const items = slots.filter(s => s.section === sec.key)
          if (items.length === 0) return null
          return (
            <div key={sec.key}>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">{sec.title}</h3>
                <span className="text-[10px] text-stone-300">{sec.hint}</span>
              </div>

              <div className={`grid gap-4 ${
                sec.key === 'carousel'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                  : sec.key === 'categories'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}>
                {items.map(slot => {
                  const status = statuses[slot.slot]
                  const img    = images[slot.slot]
                  const meta   = slotMeta(slot.slot)

                  return (
                    <div key={slot.slot} className="space-y-2">
                      {/* Image card */}
                      <div
                        className={`relative overflow-hidden rounded-xl bg-stone-100 border-2 ${
                          img ? 'border-transparent' : 'border-dashed border-stone-200'
                        }`}
                        style={{ aspectRatio: meta.aspect }}
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={slot.label}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-stone-300">
                            <Upload size={20} />
                            <span className="text-[10px]">No image</span>
                          </div>
                        )}

                        {/* Uploading overlay */}
                        {status === 'uploading' && (
                          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                            <Loader2 size={22} className="animate-spin text-brand-600" />
                          </div>
                        )}

                        {/* Success flash */}
                        {status === 'success' && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <CheckCircle size={22} className="text-green-600" />
                          </div>
                        )}

                        {/* Clear button */}
                        {img && status === 'idle' && (
                          <button
                            onClick={() => handleClear(slot.slot)}
                            title="Remove image"
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>

                      {/* Label + actions */}
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-stone-700 truncate">{slot.label}</p>
                        {status === 'error' && (
                          <p className="text-[10px] text-red-500 leading-tight">{errors[slot.slot]}</p>
                        )}
                        <button
                          onClick={() => fileRefs.current[slot.slot]?.click()}
                          disabled={status === 'uploading'}
                          className="w-full py-1.5 rounded-lg border border-stone-200 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          <Upload size={11} />
                          {img ? 'Change' : 'Upload'}
                        </button>
                        <input
                          ref={el => { fileRefs.current[slot.slot] = el }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) onFileChange(slot.slot, file)
                            e.target.value = ''
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
