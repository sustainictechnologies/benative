'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Check } from 'lucide-react'

export type CropShape = 'square' | 'circle' | 'rect'

export interface CropData {
  x:     number   // 0–100
  y:     number   // 0–100
  zoom:  number   // 1–3
  shape: CropShape
}

interface Props {
  imageUrl: string
  initial?: Partial<CropData>
  onApply:  (crop: CropData) => void
  onClose:  () => void
}

const SHAPES: { value: CropShape; icon: string; label: string }[] = [
  { value: 'square', icon: '⬜', label: 'Square'    },
  { value: 'circle', icon: '⭕', label: 'Circle'    },
  { value: 'rect',   icon: '▬',  label: 'Wide'      },
]

const FRAME: Record<CropShape, { w: number; h: number; radius: string }> = {
  square: { w: 260, h: 260, radius: '12px'  },
  circle: { w: 260, h: 260, radius: '50%'   },
  rect:   { w: 300, h: 188, radius: '12px'  },
}

export default function ImageCropModal({ imageUrl, initial, onApply, onClose }: Props) {
  const [shape, setShape] = useState<CropShape>(initial?.shape ?? 'square')
  const [x, setX]         = useState(initial?.x    ?? 50)
  const [y, setY]         = useState(initial?.y    ?? 50)
  const [zoom, setZoom]   = useState(initial?.zoom  ?? 1)
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef({ startMX: 0, startMY: 0, startX: 0, startY: 0 })
  const frame   = FRAME[shape]

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    dragRef.current = { startMX: e.clientX, startMY: e.clientY, startX: x, startY: y }
  }, [x, y])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      // drag right → see left of image → x decreases; sensitivity: ~2.5px per %
      const sensitivity = 2.5 * zoom
      const nx = Math.min(100, Math.max(0, dragRef.current.startX - (e.clientX - dragRef.current.startMX) / sensitivity))
      const ny = Math.min(100, Math.max(0, dragRef.current.startY - (e.clientY - dragRef.current.startMY) / sensitivity))
      setX(nx)
      setY(ny)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, zoom])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(prev => Math.min(3, Math.max(1, prev + (e.deltaY < 0 ? 0.1 : -0.1))))
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: 360 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-900">Adjust Photo</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Drag frame */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="overflow-hidden bg-stone-100 select-none ring-2 ring-stone-200"
              style={{
                width:        frame.w,
                height:       frame.h,
                borderRadius: frame.radius,
                cursor:       dragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={onMouseDown}
              onWheel={onWheel}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="crop preview"
                draggable={false}
                className="w-full h-full pointer-events-none"
                style={{
                  objectFit:       'cover',
                  objectPosition:  `${x}% ${y}%`,
                  transform:       zoom !== 1 ? `scale(${zoom})` : undefined,
                  transformOrigin: `${x}% ${y}%`,
                  transition:      dragging ? 'none' : 'transform 0.15s ease',
                }}
              />
            </div>
            <p className="text-[11px] text-stone-400">Drag to reposition · Scroll to zoom</p>
          </div>

          {/* Shape */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Shape</p>
            <div className="flex gap-2">
              {SHAPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setShape(s.value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    shape === s.value
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  <span className="text-base leading-none">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Zoom</p>
              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">{zoom.toFixed(1)}×</span>
            </div>
            <input
              type="range" min="1" max="3" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full accent-stone-800 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-stone-300 mt-1">
              <span>1×</span><span>3×</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onApply({ x, y, zoom, shape })}
              className="flex-[2] py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Check size={13} /> Apply Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
