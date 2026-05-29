'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'

import type { CanvasBlock, BlockType, BlockProps } from './BuilderTypes'
import { DEFAULT_PROPS, PALETTE } from './BuilderTypes'
import { BuilderContext } from './BuilderContext'
import BuilderTopbar from './BuilderTopbar'
import LeftPanel from './LeftPanel'
import Canvas from './Canvas'
import RightPanel from './RightPanel'
import PublishModal from './PublishModal'

/* ─── Helpers ────────────────────────────────────────────── */
function makeId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function makeBlock(type: BlockType): CanvasBlock {
  return { id: makeId(), type, props: { ...DEFAULT_PROPS } }
}

/* ─── Initial canvas state ───────────────────────────────── */
const INITIAL_BLOCKS: CanvasBlock[] = [
  { id: 'init-hero',    type: 'hero',        props: { ...DEFAULT_PROPS } },
  { id: 'init-story',   type: 'host-story',  props: { ...DEFAULT_PROPS } },
  { id: 'init-birding', type: 'activity-log', props: { ...DEFAULT_PROPS } },
  { id: 'init-rules',   type: 'rules-block', props: { ...DEFAULT_PROPS } },
]

/* ─── Main Component ─────────────────────────────────────── */
export default function BuilderClient() {
  const [blocks, setBlocks]             = useState<CanvasBlock[]>(INITIAL_BLOCKS)
  const [selectedId, setSelectedId]     = useState<string | null>('init-hero')
  const [previewMode, setPreviewMode]   = useState(false)
  const [viewport, setViewport]         = useState<'desktop' | 'mobile'>('desktop')
  const [draggingType, setDraggingType] = useState<BlockType | null>(null)
  const [pageName, setPageName]             = useState('My Homestay')
  const [pageHighlights, setPageHighlights] = useState(['Bird Watching', 'Long Stays Welcome'])
  const [pageLanguages, setPageLanguages]   = useState(['Marathi', 'Hindi', 'English'])
  const [pageAddress, setPageAddress]       = useState('Khed, Ratnagiri, Maharashtra')
  const [savedAt, setSavedAt]               = useState<Date | null>(null)
  const [showPublish, setShowPublish]       = useState(false)

  /* ── Load draft from localStorage on mount ───────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('benative-builder-draft')
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.blocks)         setBlocks(draft.blocks)
      if (draft.pageName)       setPageName(draft.pageName)
      if (draft.pageHighlights) setPageHighlights(draft.pageHighlights)
      if (draft.pageLanguages)  setPageLanguages(draft.pageLanguages)
      if (draft.pageAddress)    setPageAddress(draft.pageAddress)
    } catch {}
  }, [])

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem('benative-builder-draft', JSON.stringify({ blocks, pageName, pageHighlights, pageLanguages, pageAddress }))
      setSavedAt(new Date())
    } catch {}
  }, [blocks, pageHighlights, pageLanguages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null

  /* ── Block operations ────────────────────────────────── */
  const addBlock = useCallback((type: BlockType, atIndex?: number) => {
    const b = makeBlock(type)
    setBlocks(prev => {
      if (atIndex !== undefined && atIndex >= 0) {
        const next = [...prev]
        next.splice(atIndex, 0, b)
        return next
      }
      return [...prev, b]
    })
    setSelectedId(b.id)
  }, [])

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSelectedId(prev => prev === id ? null : prev)
  }, [])

  const updateBlock = useCallback((id: string, props: Partial<BlockProps>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props: { ...b.props, ...props } } : b))
  }, [])

  const moveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (idx < 0) return prev
      const next = dir === 'up' ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1)
      return arrayMove(prev, idx, next)
    })
  }, [])

  const duplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (idx < 0) return prev
      const orig = prev[idx]
      const clone: CanvasBlock = { ...orig, id: makeId() }
      const next = [...prev]
      next.splice(idx + 1, 0, clone)
      return next
    })
  }, [])

  /* ── Image operations (via context) ──────────────────── */
  const updateImage = useCallback((blockId: string, imageKey: string, url: string | null) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const images = { ...(b.props.images ?? {}) }
      if (url === null) delete images[imageKey]
      else images[imageKey] = url
      return { ...b, props: { ...b.props, images } }
    }))
  }, [])

  const getImage = useCallback((blockId: string, imageKey: string, defaultUrl: string): string => {
    const block = blocks.find(b => b.id === blockId)
    return block?.props.images?.[imageKey] ?? defaultUrl
  }, [blocks])

  /* ── Text operations (via context) ───────────────────── */
  const updateText = useCallback((blockId: string, textKey: string, value: string | null) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts = { ...(b.props.texts ?? {}) }
      if (value === null) delete texts[textKey]
      else texts[textKey] = value
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [])

  const getText = useCallback((blockId: string, textKey: string, defaultValue: string): string => {
    const block = blocks.find(b => b.id === blockId)
    return block?.props.texts?.[textKey] ?? defaultValue
  }, [blocks])

  /* ── Context value ───────────────────────────────────── */
  const contextValue = useMemo(() => ({
    updateImage,
    getImage,
    updateText,
    getText,
    previewMode,
  }), [updateImage, getImage, updateText, getText, previewMode])

  /* ── Drag handlers ───────────────────────────────────── */
  const handleDragStart = ({ active }: DragStartEvent) => {
    const bt = active.data.current?.blockType as BlockType | undefined
    if (bt) setDraggingType(bt)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingType(null)
    if (!over) return

    const fromPalette = active.data.current?.source === 'palette'

    if (fromPalette) {
      const blockType = active.data.current!.blockType as BlockType
      const overIndex = blocks.findIndex(b => b.id === over.id)
      addBlock(blockType, overIndex >= 0 ? overIndex + 1 : undefined)
    } else {
      const oldIdx = blocks.findIndex(b => b.id === active.id)
      const newIdx = blocks.findIndex(b => b.id === over.id)
      if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
        setBlocks(prev => arrayMove(prev, oldIdx, newIdx))
      }
    }
  }

  const draggingMeta = PALETTE.find(p => p.type === draggingType)

  return (
    <BuilderContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Full-screen overlay */}
        <div className="fixed inset-0 z-[200] flex flex-col bg-stone-100">

          <BuilderTopbar
            previewMode={previewMode}
            viewport={viewport}
            blockCount={blocks.length}
            onTogglePreview={() => { setPreviewMode(v => !v); if (previewMode) setSelectedId(null) }}
            onViewportChange={setViewport}
            onSave={handleSave}
            savedAt={savedAt}
            onPublish={() => setShowPublish(true)}
          />

          <div className="flex flex-1 overflow-hidden">

            {!previewMode && <LeftPanel />}

            <Canvas
              blocks={blocks}
              selectedId={selectedId}
              previewMode={previewMode}
              viewport={viewport}
              onSelect={setSelectedId}
              onRemove={removeBlock}
              onMoveUp={id => moveBlock(id, 'up')}
              onMoveDown={id => moveBlock(id, 'down')}
              onDuplicate={duplicateBlock}
              pageName={pageName}
              onNameChange={setPageName}
              pageHighlights={pageHighlights}
              pageLanguages={pageLanguages}
              onHighlightsChange={setPageHighlights}
              onLanguagesChange={setPageLanguages}
              pageAddress={pageAddress}
              onAddressChange={setPageAddress}
            />

            {!previewMode && selectedBlock && (
              <RightPanel
                block={selectedBlock}
                onUpdate={props => updateBlock(selectedBlock.id, props)}
              />
            )}

            {!previewMode && !selectedBlock && (
              <motion.aside
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-60 bg-white border-l border-stone-200 flex items-center justify-center shrink-0"
              >
                <div className="text-center px-6">
                  <div className="text-3xl mb-2">👆</div>
                  <p className="text-xs font-semibold text-stone-500">Click any section</p>
                  <p className="text-[11px] text-stone-400 mt-1">to edit its styles</p>
                </div>
              </motion.aside>
            )}
          </div>
        </div>

        <PublishModal
          open={showPublish}
          onClose={() => setShowPublish(false)}
          builderData={{
            title:     pageName,
            hostName:  blocks.find(b => b.type === 'hero')?.props.texts?.['contact-name']     ?? '',
            phone:     blocks.find(b => b.type === 'hero')?.props.texts?.['contact-phone']    ?? '',
            whatsapp:  blocks.find(b => b.type === 'hero')?.props.texts?.['contact-whatsapp'] ?? '',
            email:     blocks.find(b => b.type === 'hero')?.props.texts?.['contact-email']    ?? '',
            address:   pageAddress,
            languages: pageLanguages,
            blocks,
          }}
        />

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {draggingType && draggingMeta && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-white border-2 border-brand-400 rounded-xl shadow-2xl text-sm font-semibold text-brand-700 opacity-95 rotate-1 scale-105">
              <span className="text-base">{draggingMeta.emoji}</span>
              <span>{draggingMeta.label}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </BuilderContext.Provider>
  )
}
