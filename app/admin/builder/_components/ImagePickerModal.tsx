'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Link2, Upload, ImageIcon, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  currentUrl: string
  onConfirm: (url: string) => void
  onClose: () => void
}

type Tab = 'url' | 'upload'

export default function ImagePickerModal({ currentUrl, onConfirm, onClose }: Props) {
  const [tab, setTab]           = useState<Tab>('url')
  const [urlInput, setUrlInput] = useState(currentUrl)
  const [preview, setPreview]   = useState(currentUrl)
  const [dragging, setDragging]   = useState(false)
  const [fileName, setFileName]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [fileObj, setFileObj]     = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── URL tab ── */
  const handleUrlApply = () => {
    if (urlInput.trim()) onConfirm(urlInput.trim())
  }

  /* ── File tab — preview only, upload on confirm ── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setFileObj(file)
    setFileName(file.name)
    setPreview(URL.createObjectURL(file))
    setUploadErr('')
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleConfirmUpload = async () => {
    if (!fileObj) return
    setUploading(true)
    setUploadErr('')
    try {
      const supabase = createClient()
      const ext  = fileObj.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('homestay-images')
        .upload(path, fileObj, { upsert: false })
      if (error) { setUploadErr(error.message); return }
      const { data: { publicUrl } } = supabase.storage
        .from('homestay-images')
        .getPublicUrl(path)
      onConfirm(publicUrl)
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    /* Backdrop */
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
            <h2 className="text-sm font-bold text-stone-900">Replace Image</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100">
          {([
            { id: 'url'    as Tab, label: 'Image URL', icon: Link2 },
            { id: 'upload' as Tab, label: 'Upload File', icon: Upload },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                tab === id
                  ? 'text-brand-600 border-brand-600'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">

          {/* ── URL Tab ── */}
          {tab === 'url' && (
            <>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1.5">Paste image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setPreview(e.target.value) }}
                    placeholder="https://images.unsplash.com/…"
                    className="flex-1 text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300"
                    onKeyDown={e => e.key === 'Enter' && handleUrlApply()}
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Supports Unsplash, Cloudinary, or any direct image URL</p>
              </div>

              {/* Preview */}
              {preview && (
                <div className="rounded-xl overflow-hidden border border-stone-100 bg-stone-50 h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreview('')}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleUrlApply}
                  disabled={!urlInput.trim()}
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  Apply Image
                </button>
              </div>
            </>
          )}

          {/* ── Upload Tab ── */}
          {tab === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragging
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload size={22} className={`mx-auto mb-2 ${dragging ? 'text-brand-500' : 'text-stone-300'}`} />
                <p className="text-xs font-semibold text-stone-600">
                  {dragging ? 'Drop to upload' : 'Click or drag image here'}
                </p>
                <p className="text-[10px] text-stone-400 mt-1">JPG, PNG, WEBP — max 10 MB</p>
              </div>

              {/* Preview after upload */}
              {preview && preview !== currentUrl && (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-stone-100 bg-stone-50 h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  {fileName && (
                    <p className="text-[10px] text-stone-400 truncate">📎 {fileName}</p>
                  )}
                </div>
              )}

              {uploadErr && <p className="text-xs text-rose-500">{uploadErr}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={!fileObj || uploading}
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {uploading
                    ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
                    : <><CheckCircle2 size={13} /> Use This Image</>
                  }
                </button>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  )
}
