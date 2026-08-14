'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Link2, Upload, ImageIcon, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface CropState {
  shape: 'circle' | 'rounded' | 'square'
  zoom:  number
  panX:  number   // 0–100
  panY:  number   // 0–100
}

interface Props {
  currentUrl: string
  onConfirm:  (url: string) => void
  onClose:    () => void
  withCrop?:          boolean
  cropInitial?:       Partial<CropState>
  onConfirmWithCrop?: (url: string, crop: CropState) => void
}

type Tab  = 'url' | 'upload'
type Step = 'pick' | 'crop'

export default function ImagePickerModal({
  currentUrl, onConfirm, onClose,
  withCrop, cropInitial, onConfirmWithCrop,
}: Props) {
  const [tab,       setTab]      = useState<Tab>('url')
  const [step,      setStep]     = useState<Step>(withCrop && currentUrl ? 'crop' : 'pick')
  const [urlInput,  setUrlInput] = useState(currentUrl)
  const [preview,   setPreview]  = useState(currentUrl)
  const [pickedUrl, setPickedUrl] = useState(withCrop && currentUrl ? currentUrl : '')

  const [fileDragging, setFileDragging] = useState(false)
  const [fileName,     setFileName]     = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [uploadErr,    setUploadErr]    = useState('')
  const [fileObj,      setFileObj]      = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Crop state
  const [cropShape] = useState<CropState['shape']>(cropInitial?.shape ?? 'rounded')
  const [cropZoom,  setCropZoom]  = useState<number>(cropInitial?.zoom ?? 1)
  const [cropPanX,  setCropPanX]  = useState<number>(cropInitial?.panX ?? 50)
  const [cropPanY,  setCropPanY]  = useState<number>(cropInitial?.panY ?? 0)

  // Drag-to-pan
  const cropContainerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: cropPanX, startPanY: cropPanY }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !cropContainerRef.current) return
    const { width, height } = cropContainerRef.current.getBoundingClientRect()
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    // Drag right → image moves right → shows left side → panX decreases
    setCropPanX(Math.max(0, Math.min(100, dragRef.current.startPanX - (dx / width)  * 150)))
    setCropPanY(Math.max(0, Math.min(100, dragRef.current.startPanY - (dy / height) * 150)))
  }

  const handlePointerUp = () => { dragRef.current = null }

  /* ── URL: advance to crop or confirm directly ── */
  const handleUrlNext = () => {
    const url = urlInput.trim()
    if (!url) return
    if (withCrop) { setPickedUrl(url); setStep('crop') }
    else onConfirm(url)
  }

  /* ── File pick ── */
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setFileObj(file)
    setFileName(file.name)
    setPreview(URL.createObjectURL(file))
    setUploadErr('')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setFileDragging(false)
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
    onConfirmWithCrop?.(pickedUrl, { shape: cropShape, zoom: cropZoom, panX: cropPanX, panY: cropPanY })
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
              {step === 'crop' ? 'Crop & Position Photo' : 'Replace Image'}
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
                    onDragOver={e => { e.preventDefault(); setFileDragging(true) }}
                    onDragLeave={() => setFileDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      fileDragging ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50'
                    }`}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                    <Upload size={22} className={`mx-auto mb-2 ${fileDragging ? 'text-brand-500' : 'text-stone-300'}`} />
                    <p className="text-xs font-semibold text-stone-600">
                      {fileDragging ? 'Drop to upload' : 'Click or drag image here'}
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

        {/* ── STEP 2: CROP & POSITION ── */}
        {step === 'crop' && (
          <div className="p-5 space-y-4">

            {/* Drag-to-pan crop preview — same 6:7 ratio as the actual display frame */}
            <div className="flex flex-col items-center gap-1">
              <div
                ref={cropContainerRef}
                className="relative overflow-hidden rounded-xl border-2 border-stone-200 bg-stone-100 cursor-grab active:cursor-grabbing select-none touch-none"
                style={{ width: '240px', aspectRatio: '6/7' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {cropPreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cropPreviewUrl}
                    alt="crop preview"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      objectPosition: `${cropPanX}% ${cropPanY}%`,
                      transform: cropZoom !== 1 ? `scale(${cropZoom})` : undefined,
                      transformOrigin: `${cropPanX}% ${cropPanY}%`,
                    }}
                    draggable={false}
                  />
                )}
                {/* Rule-of-thirds grid */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
                    backgroundSize: '33.33% 33.33%',
                  }}
                />
                <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/80 drop-shadow-sm pointer-events-none">
                  Drag to reposition
                </p>
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
