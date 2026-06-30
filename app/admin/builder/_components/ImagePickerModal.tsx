'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Link2, Upload, ImageIcon, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface CropState {
  shape:    'circle' | 'rounded' | 'square'
  zoom:     number
  position: string
}

interface Props {
  currentUrl: string
  onConfirm:  (url: string) => void
  onClose:    () => void
  withCrop?:           boolean
  cropInitial?:        Partial<CropState>
  onConfirmWithCrop?:  (url: string, crop: CropState) => void
}

type Tab  = 'url' | 'upload'
type Step = 'pick' | 'crop'

const CROP_SHAPE_OPTIONS = [
  { value: 'circle'  as const, label: '●', title: 'Circle'  },
  { value: 'rounded' as const, label: '▢', title: 'Rounded' },
  { value: 'square'  as const, label: '■', title: 'Square'  },
]

const SHAPE_CLASS: Record<string, string> = {
  circle:  'rounded-full',
  rounded: 'rounded-2xl',
  square:  'rounded-none',
}

const POSITION_GRID = [
  ['top-left', 'top',    'top-right'   ],
  ['left',     'center', 'right'       ],
  ['bottom-left', 'bottom', 'bottom-right'],
]

const POSITION_ARROW: Record<string, string> = {
  'top-left': '↖', 'top': '↑', 'top-right': '↗',
  'left': '←', 'center': '·', 'right': '→',
  'bottom-left': '↙', 'bottom': '↓', 'bottom-right': '↘',
}

const ORIGIN_MAP: Record<string, string> = {
  'top-left': '0% 0%',    'top': '50% 0%',    'top-right': '100% 0%',
  'left':     '0% 50%',   'center': '50% 50%', 'right':    '100% 50%',
  'bottom-left': '0% 100%', 'bottom': '50% 100%', 'bottom-right': '100% 100%',
}

export default function ImagePickerModal({
  currentUrl, onConfirm, onClose,
  withCrop, cropInitial, onConfirmWithCrop,
}: Props) {
  const [tab,      setTab]      = useState<Tab>('url')
  const [step,     setStep]     = useState<Step>(withCrop && currentUrl ? 'crop' : 'pick')
  const [urlInput, setUrlInput] = useState(currentUrl)
  const [preview,  setPreview]  = useState(currentUrl)
  const [pickedUrl, setPickedUrl] = useState(withCrop && currentUrl ? currentUrl : '')

  const [dragging,  setDragging]  = useState(false)
  const [fileName,  setFileName]  = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [fileObj,   setFileObj]   = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [cropShape,    setCropShape]    = useState<CropState['shape']>(cropInitial?.shape    ?? 'circle')
  const [cropZoom,     setCropZoom]     = useState<number>            (cropInitial?.zoom     ?? 1)
  const [cropPosition, setCropPosition] = useState<string>            (cropInitial?.position ?? 'center')

  /* ── URL: advance to crop or confirm directly ── */
  const handleUrlNext = () => {
    const url = urlInput.trim()
    if (!url) return
    if (withCrop) { setPickedUrl(url); setStep('crop') }
    else onConfirm(url)
  }

  /* ── File pick ── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setFileObj(file)
    setFileName(file.name)
    setPreview(URL.createObjectURL(file))
    setUploadErr('')
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) handleFile(f)
  }

  /* ── Upload then advance to crop or confirm ── */
  const handleUploadNext = async () => {
    if (!fileObj) return
    setUploading(true); setUploadErr('')
    try {
      const supabase = createClient()
      const ext  = fileObj.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('homestay-images').upload(path, fileObj, { upsert: false })
      if (error) { setUploadErr(error.message); return }
      const { data: { publicUrl } } = supabase.storage.from('homestay-images').getPublicUrl(path)
      if (withCrop) { setPickedUrl(publicUrl); setStep('crop') }
      else onConfirm(publicUrl)
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleApplyCrop = () => {
    onConfirmWithCrop?.(pickedUrl, { shape: cropShape, zoom: cropZoom, position: cropPosition })
  }

  const cropPreviewUrl = pickedUrl || preview

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-brand-600" />
            <h2 className="text-sm font-bold text-stone-900">
              {step === 'crop' ? 'Crop & Shape Photo' : 'Replace Image'}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── STEP 1: PICK ── */}
        {step === 'pick' && (
          <>
            <div className="flex border-b border-stone-100">
              {([
                { id: 'url'    as Tab, label: 'Image URL',   icon: Link2  },
                { id: 'upload' as Tab, label: 'Upload File', icon: Upload },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id} onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                    tab === id ? 'text-brand-600 border-brand-600' : 'text-stone-400 border-transparent hover:text-stone-600'
                  }`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {tab === 'url' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1.5">Paste image URL</label>
                    <input
                      type="text" value={urlInput}
                      onChange={e => { setUrlInput(e.target.value); setPreview(e.target.value) }}
                      placeholder="https://images.unsplash.com/…"
                      className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300"
                      onKeyDown={e => e.key === 'Enter' && handleUrlNext()}
                      autoFocus
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Supports Unsplash, Cloudinary, or any direct image URL</p>
                  </div>
                  {preview && (
                    <div className="rounded-xl overflow-hidden border border-stone-100 bg-stone-50 h-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="preview" className="w-full h-full object-cover" onError={() => setPreview('')} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleUrlNext} disabled={!urlInput.trim()}
                      className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      {withCrop ? 'Next: Crop →' : 'Apply Image'}
                    </button>
                  </div>
                </>
              )}

              {tab === 'upload' && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragging ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50'
                    }`}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                    <Upload size={22} className={`mx-auto mb-2 ${dragging ? 'text-brand-500' : 'text-stone-300'}`} />
                    <p className="text-xs font-semibold text-stone-600">
                      {dragging ? 'Drop to upload' : 'Click or drag image here'}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1">JPG, PNG, WEBP — max 10 MB</p>
                  </div>
                  {preview && preview !== currentUrl && (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-stone-100 bg-stone-50 h-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      {fileName && <p className="text-[10px] text-stone-400 truncate">📎 {fileName}</p>}
                    </div>
                  )}
                  {uploadErr && <p className="text-xs text-rose-500">{uploadErr}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadNext} disabled={!fileObj || uploading}
                      className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {uploading
                        ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
                        : withCrop
                          ? <><CheckCircle2 size={13} /> Upload &amp; Crop →</>
                          : <><CheckCircle2 size={13} /> Use This Image</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── STEP 2: CROP ── */}
        {step === 'crop' && (
          <div className="p-5 space-y-4">

            {/* Live preview */}
            <div className="flex justify-center py-2">
              <div className={`w-36 h-36 overflow-hidden border-2 border-stone-200 bg-stone-100 ${SHAPE_CLASS[cropShape] ?? 'rounded-full'}`}>
                {cropPreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cropPreviewUrl}
                    alt="crop preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform:       cropZoom !== 1 ? `scale(${cropZoom})` : undefined,
                      transformOrigin: ORIGIN_MAP[cropPosition] ?? '50% 50%',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Shape */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Shape</p>
              <div className="flex gap-2">
                {CROP_SHAPE_OPTIONS.map(s => (
                  <button
                    key={s.value} title={s.title} onClick={() => setCropShape(s.value)}
                    className={`flex-1 py-2.5 text-lg rounded-xl font-bold transition-colors ${
                      cropShape === s.value
                        ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                        : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Zoom</p>
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  {cropZoom.toFixed(1)}×
                </span>
              </div>
              <input
                type="range" min="1" max="3" step="0.05" value={cropZoom}
                onChange={e => setCropZoom(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-300 mt-0.5">
                <span>1×</span><span>3×</span>
              </div>
            </div>

            {/* Focus point */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Focus point</p>
              <div className="grid grid-cols-3 gap-1.5">
                {POSITION_GRID.flat().map(pos => (
                  <button
                    key={pos} title={pos} onClick={() => setCropPosition(pos)}
                    className={`h-10 rounded-xl text-base transition-colors ${
                      cropPosition === pos
                        ? 'bg-brand-500 text-white'
                        : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {POSITION_ARROW[pos]}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep('pick')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <ChevronLeft size={13} /> Change Photo
              </button>
              <button
                onClick={handleApplyCrop}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Apply Photo
              </button>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  )
}
