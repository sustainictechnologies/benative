'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, MapPin, Globe2, X, Plus } from 'lucide-react'
import CanvasBlockItem from './CanvasBlock'
import type { CanvasBlock } from './BuilderTypes'

interface Props {
  blocks: CanvasBlock[]
  selectedId: string | null
  previewMode: boolean
  viewport: 'desktop' | 'mobile'
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleHidden: (id: string) => void
  pageName: string
  onNameChange: (v: string) => void
  pageHighlights: string[]
  pageLanguages: string[]
  onHighlightsChange: (v: string[]) => void
  onLanguagesChange: (v: string[]) => void
  pageAddress: string
  onAddressChange: (v: string) => void
}

function EmptyState({ isOver }: { isOver: boolean }) {
  return (
    <motion.div
      animate={{ borderColor: isOver ? '#1e6b1e' : '#d1d5db', background: isOver ? '#f0f7f0' : '#fafafa' }}
      transition={{ duration: 0.2 }}
      className="m-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-16 gap-4 transition-colors"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isOver ? 'bg-brand-100' : 'bg-stone-100'}`}>
        <Layers size={24} className={isOver ? 'text-brand-600' : 'text-stone-400'} />
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold mb-1 transition-colors ${isOver ? 'text-brand-700' : 'text-stone-500'}`}>
          {isOver ? 'Release to add section' : 'Drag sections here'}
        </p>
        <p className="text-xs text-stone-400">Pick sections from the left panel and drag them onto this canvas</p>
      </div>
    </motion.div>
  )
}

/* ─── Inline add-tag input ──────────────────────────────── */
function AddTagInput({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false)
  const [val, setVal]   = useState('')

  const commit = () => {
    if (val.trim()) { onAdd(val.trim()); setVal('') }
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-0.5 text-[10px] text-stone-400 hover:text-brand-600 border border-dashed border-stone-300 hover:border-brand-400 px-2 py-0.5 rounded-full transition-colors"
      >
        <Plus size={10} /> Add
      </button>
    )
  }

  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false) }}
      placeholder={placeholder}
      className="text-[11px] border border-brand-400 rounded-full px-2.5 py-0.5 outline-none w-28 bg-brand-50 placeholder:text-stone-300"
    />
  )
}

export default function Canvas({
  blocks, selectedId, previewMode, viewport,
  onSelect, onRemove, onMoveUp, onMoveDown, onDuplicate, onToggleHidden,
  pageName, onNameChange,
  pageHighlights, pageLanguages, onHighlightsChange, onLanguagesChange,
  pageAddress, onAddressChange,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' })

  const isMobile = viewport === 'mobile'
  const canvasWidth = isMobile ? 390 : '100%'

  return (
    <div className="flex-1 overflow-auto bg-stone-200 flex flex-col items-center py-6 px-4">
      {/* Device frame */}
      <motion.div
        animate={{ width: canvasWidth, maxWidth: isMobile ? 390 : 860 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full"
        style={{ maxWidth: isMobile ? 390 : 860 }}
      >
        {/* Browser chrome */}
        {!previewMode && (
          <div className="bg-stone-700 rounded-t-xl px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-stone-600 rounded-md px-3 py-1 text-center">
              <span className="text-[10px] text-stone-300 font-mono">benative.in/stays/your-homestay</span>
            </div>
          </div>
        )}

        {/* Canvas body */}
        <div
          ref={setNodeRef}
          className={`bg-white shadow-2xl overflow-hidden ${previewMode ? 'rounded-xl' : 'rounded-b-xl'} min-h-[400px]`}
        >
          {/* Page header */}
          <div className="px-4 sm:px-6 pt-4 pb-1 space-y-1.5">

            {/* Highlights row */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-semibold bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">✓ Verified Host</span>

              {pageHighlights.map((tag, i) => (
                <span key={i} className="group/tag relative flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                  {tag}
                  {!previewMode && (
                    <button
                      onClick={() => onHighlightsChange(pageHighlights.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover/tag:opacity-100 text-stone-400 hover:text-rose-500 transition-opacity ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}

              {!previewMode && (
                <AddTagInput
                  placeholder="e.g. Solo Friendly"
                  onAdd={tag => onHighlightsChange([...pageHighlights, tag])}
                />
              )}
            </div>

            {previewMode ? (
              <h1 className="text-2xl font-bold text-stone-900">{pageName}</h1>
            ) : (
              <input
                value={pageName}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Homestay name"
                className="text-2xl font-bold text-stone-900 bg-transparent outline-none border-b-2 border-dashed border-stone-200 focus:border-brand-400 w-full transition-colors"
              />
            )}

            {/* Location + Languages row */}
            <div className="flex items-center gap-4 text-sm text-stone-500 flex-wrap">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MapPin size={14} className="text-stone-400 shrink-0" />
                {previewMode ? (
                  <span className="truncate">{pageAddress}</span>
                ) : (
                  <input
                    value={pageAddress}
                    onChange={e => onAddressChange(e.target.value)}
                    placeholder="e.g. Khed, Ratnagiri, Maharashtra"
                    className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-brand-400 w-full max-w-xs"
                  />
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Globe2 size={14} className="text-stone-400 shrink-0" />
                {pageLanguages.map((lang, i) => (
                  <span key={i} className="group/lang relative flex items-center gap-0.5">
                    {i > 0 && <span className="text-stone-300 mr-0.5">·</span>}
                    {lang}
                    {!previewMode && (
                      <button
                        onClick={() => onLanguagesChange(pageLanguages.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover/lang:opacity-100 text-stone-300 hover:text-rose-500 transition-opacity"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </span>
                ))}
                {!previewMode && (
                  <AddTagInput
                    placeholder="e.g. Kannada"
                    onAdd={lang => onLanguagesChange([...pageLanguages, lang])}
                  />
                )}
              </div>
            </div>
          </div>

          {blocks.length === 0 ? (
            <EmptyState isOver={isOver} />
          ) : (
            <SortableContext
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="px-4 sm:px-6 pt-1 pb-8 space-y-4">
                <AnimatePresence>
                  {blocks.map(block => {
                    if (previewMode && block.hidden) return null
                    return (
                      <CanvasBlockItem
                        key={block.id}
                        block={block}
                        selected={!previewMode && block.id === selectedId}
                        onSelect={() => onSelect(block.id)}
                        onRemove={() => onRemove(block.id)}
                        onMoveUp={() => onMoveUp(block.id)}
                        onMoveDown={() => onMoveDown(block.id)}
                        onDuplicate={() => onDuplicate(block.id)}
                        onToggleHidden={() => onToggleHidden(block.id)}
                      />
                    )
                  })}
                </AnimatePresence>
              </div>
            </SortableContext>
          )}

          {/* Drop indicator when dragging over non-empty canvas */}
          {isOver && blocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-1 bg-brand-400 mx-4 rounded-full my-1"
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}
