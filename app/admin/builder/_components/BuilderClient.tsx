'use client'

import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Monitor } from 'lucide-react'

import type { CanvasBlock, BlockType, BlockProps } from './BuilderTypes'
import { DEFAULT_PROPS, PALETTE } from './BuilderTypes'
import { BuilderContext, SelectedElement, LayoutRow, LayoutCell, CellType } from './BuilderContext'
import BuilderTopbar from './BuilderTopbar'
import LeftPanel from './LeftPanel'
import Canvas from './Canvas'
import RightPanel from './RightPanel'
import PublishModal from './PublishModal'
import PreviewShareModal from './PreviewShareModal'

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
  const [isSmallScreen, setIsSmallScreen] = useState(false)
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
  const [showPublish, setShowPublish]           = useState(false)
  const [showPreviewShare, setShowPreviewShare] = useState(false)
  const [selectedElement, setSelectedElement]   = useState<SelectedElement | null>(null)

  const searchParams  = useSearchParams()
  const editSlug      = searchParams.get('slug')
  const loadedRef     = useRef(false)

  /* ── Builder needs desktop width for the 3-panel layout ──── */
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsSmallScreen(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  /* ── Undo history ────────────────────────────────────────── */
  const historyRef      = useRef<CanvasBlock[][]>([])
  const snapshotTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSnapshotRef = useRef<CanvasBlock[]>(INITIAL_BLOCKS)
  const skipSnapshotRef = useRef(false)

  /* ── Load existing homestay when slug is in URL ─────────── */
  useEffect(() => {
    if (!editSlug || loadedRef.current) return
    loadedRef.current = true

    const supabase = createClient()
    supabase
      .from('homestays')
      .select(`*, homestay_blocks ( id, block_type, sort_order, content_data )`)
      .eq('slug', editSlug)
      .single()
      .then(({ data: h }) => {
        if (!h) return

        setPageName(h.title ?? '')
        setPageLanguages(h.languages_spoken ?? [])
        setPageAddress(h.address ?? `${h.village_name ?? ''}, ${h.location_district ?? ''}`)

        const raw = (h.homestay_blocks ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)

        const loaded: CanvasBlock[] = raw.map((block: any, i: number) => {
          const d    = block.content_data ?? {}
          const type = block.block_type as BlockType
          const images: Record<string, string> = {}
          const texts:  Record<string, string> = {}

          switch (type) {
            case 'hero':
              if (d.cover_image_url)   images['cover']   = d.cover_image_url
              if (d.tagline)           texts['tagline']  = d.tagline
              break
            case 'contact':
              texts['contact-host-name'] = d.host_name ?? h.host_name ?? ''
              if (d.phone        || h.contact_phone)   { texts['contact-phone']         = d.phone        ?? h.contact_phone   ?? ''; texts['contact-phone-show']         = d.phone_show         === false ? 'false' : 'true' }
              if (d.whatsapp     || h.whatsapp_number) { texts['contact-whatsapp']       = d.whatsapp     ?? h.whatsapp_number ?? ''; texts['contact-whatsapp-show']       = d.whatsapp_show       === false ? 'false' : 'true' }
              if (d.email        || h.email)           { texts['contact-email']          = d.email        ?? h.email           ?? ''; texts['contact-email-show']          = d.email_show          === false ? 'false' : 'true' }
              if (d.address      || h.address)         { texts['contact-address']        = d.address      ?? h.address         ?? ''; texts['contact-address-show']        = d.address_show        === false ? 'false' : 'true' }
              if (d.calling_window || h.calling_window){ texts['contact-calling-window'] = d.calling_window ?? h.calling_window ?? ''; texts['contact-calling-window-show'] = d.calling_window_show === false ? 'false' : 'true' }
              if (d.alt_phone)    { texts['contact-alt-phone']    = d.alt_phone;    texts['contact-alt-phone-show']    = d.alt_phone_show    === false ? 'false' : 'true' }
              if (d.alt_whatsapp) { texts['contact-alt-whatsapp'] = d.alt_whatsapp; texts['contact-alt-whatsapp-show'] = d.alt_whatsapp_show === false ? 'false' : 'true' }
              if (d.website)      { texts['contact-website']      = d.website;      texts['contact-website-show']      = d.website_show      === false ? 'false' : 'true' }
              if (d.instagram)    { texts['contact-instagram']    = d.instagram;    texts['contact-instagram-show']    = d.instagram_show    === false ? 'false' : 'true' }
              if (d.facebook)     { texts['contact-facebook']     = d.facebook;     texts['contact-facebook-show']     = d.facebook_show     === false ? 'false' : 'true' }
              if (d.youtube)      { texts['contact-youtube']      = d.youtube;      texts['contact-youtube-show']      = d.youtube_show      === false ? 'false' : 'true' }
              break
            case 'host-story':
              if (d.host_image_url)    images['host-photo']       = d.host_image_url
              if (d.story_title)       texts['story-title']       = d.story_title
              if (d.story_text)        texts['story-body']        = d.story_text
              if (d.host_photo_shape)  texts['host-shape']        = d.host_photo_shape
              if (d.host_photo_position) texts['host-position']   = d.host_photo_position
              if (d.host_photo_zoom != null) texts['host-zoom']   = String(d.host_photo_zoom)
              break
            case 'activity-log':
              texts['activities'] = JSON.stringify(d.highlight_species ?? [])
              break
            case 'rules-block': {
              if (d.title) texts['rules-title'] = d.title
              const rulesRows = d.sections as Array<{ rowId: string; cols: Array<{ id: string; title?: string; items?: string[] }> }> | undefined
              if (rulesRows?.length) {
                texts['rules-rows'] = JSON.stringify(
                  rulesRows.map(row => ({ rowId: row.rowId, cols: row.cols.map(c => c.id) }))
                )
                rulesRows.forEach(row => row.cols.forEach(col => {
                  if (col.title) texts[`${col.id}-title`] = col.title
                  if (col.items?.length) texts[`${col.id}-items`] = JSON.stringify(col.items)
                }))
              }
              break
            }
            case 'how-to-reach': {
              if (d.title) texts['reach-title'] = d.title
              const reachRows = d.sections as Array<{ rowId: string; cols: Array<{ id: string; title?: string; items?: string[] }> }> | undefined
              if (reachRows?.length) {
                texts['reach-rows'] = JSON.stringify(
                  reachRows.map(row => ({ rowId: row.rowId, cols: row.cols.map(c => c.id) }))
                )
                reachRows.forEach(row => row.cols.forEach(col => {
                  if (col.title) texts[`${col.id}-title`] = col.title
                  if (col.items?.length) texts[`${col.id}-items`] = JSON.stringify(col.items)
                }))
              }
              break
            }
            case 'video':
              if (d.youtube_video_id)  texts['youtube-url'] = d.youtube_video_id
              break
            case 'gallery': {
              const items = (d.items ?? []) as Array<{ url: string; ratio: string }>
              const meta  = items.map((item, idx) => {
                const key = `gallery-${idx}`
                if (item.url) images[key] = item.url
                return { key, ratio: item.ratio ?? 'square' }
              })
              texts['gallery-meta'] = JSON.stringify(meta)
              break
            }
            case 'map':
              if (d.location)     texts['map-location']     = d.location
              if (d.region)       texts['map-region']       = d.region
              if (d.nearest_town) texts['map-nearest-town'] = d.nearest_town
              break
            case 'food': {
              if (d.label)         texts['food-label']        = d.label
              if (d.title)         texts['food-title']        = d.title
              if (d.description)   texts['food-desc']         = d.description
              if (d.dishes_label)  texts['food-dishes-label'] = d.dishes_label
              const foodItems = (d.items ?? []) as Array<{ id?: string; name?: string }>
              const foodIds = foodItems.map((item, i) => item.id ?? `fd-${i}`)
              if (foodIds.length) texts['food-meta'] = JSON.stringify(foodIds)
              foodItems.forEach((item, i) => {
                const fid = foodIds[i]
                if (item.name) texts[`${fid}-name`] = item.name
              })
              const highlights = (d.highlights ?? []) as Array<{ id?: string; icon?: string; label?: string; sublabel?: string }>
              const hids = highlights.map((h, i) => h.id ?? `fh-${i}`)
              if (hids.length) texts['food-highlights-meta'] = JSON.stringify(hids)
              highlights.forEach((h, i) => {
                const hid = hids[i]
                if (h.icon)     texts[`${hid}-icon`]     = h.icon
                if (h.label)    texts[`${hid}-label`]    = h.label
                if (h.sublabel) texts[`${hid}-sublabel`] = h.sublabel
              })
              break
            }
            case 'rooms': {
              if (d.label)       texts['rooms-label']       = d.label
              if (d.title)       texts['rooms-title']       = d.title
              if (d.description) texts['rooms-desc']        = d.description
              if (d.count_stat)  texts['rooms-count-stat']  = d.count_stat
              if (d.guests_stat) texts['rooms-guests-stat'] = d.guests_stat
              const rooms = (d.rooms ?? []) as Array<{ id?: string; image_url?: string; name?: string; guests?: string; price?: string; details?: string }>
              const ids = rooms.map((r, i) => r.id ?? `rm-${i}`)
              if (ids.length) texts['rooms-meta'] = JSON.stringify(ids)
              rooms.forEach((r, i) => {
                const rid = ids[i]
                if (r.image_url) images[rid]               = r.image_url
                if (r.name)      texts[`${rid}-name`]      = r.name
                if (r.guests)    texts[`${rid}-guests`]    = r.guests
                if (r.price)     texts[`${rid}-price`]     = r.price
                if (r.details)   texts[`${rid}-details`]   = r.details
              })
              break
            }
            default: break
          }

          // Load saved element styles generically
          if (d.styles && typeof d.styles === 'object') {
            Object.assign(texts, d.styles)
          }

          // Load saved layout rows generically
          if (d.layout && typeof d.layout === 'object') {
            const layout = d.layout as { rows?: unknown; cells?: Record<string, string>; images?: Record<string, string> }
            if (Array.isArray(layout.rows) && layout.rows.length > 0) {
              texts['layout-rows'] = JSON.stringify(layout.rows)
            }
            if (layout.cells) Object.assign(texts, layout.cells)
            if (layout.images) Object.assign(images, layout.images)
          }

          // Load saved sub-texts generically
          if (Array.isArray(d.sub_texts) && d.sub_texts.length > 0) {
            const ids = (d.sub_texts as { id: string; content: string }[]).map(st => st.id)
            texts['sub-texts'] = JSON.stringify(ids)
            for (const st of d.sub_texts as { id: string; content: string }[]) {
              if (st.id && st.content) texts[st.id] = st.content
            }
          }

          return {
            id:     `loaded-${type}-${i}`,
            type,
            props:  { ...DEFAULT_PROPS, images, texts },
            hidden: d.hidden === true,
          }
        })

        if (loaded.length > 0) {
          setBlocks(loaded)
          // Reset history — don't allow undoing back to blank initial state
          historyRef.current      = []
          lastSnapshotRef.current = loaded
          skipSnapshotRef.current = true
        }
        setSelectedId(null)
      })
  }, [editSlug])

  /* ── Load draft from localStorage on mount ───────────────── */
  useEffect(() => {
    if (editSlug) return // skip localStorage when editing existing homestay
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

  /* ── Debounced snapshot on every blocks change ───────────── */
  useEffect(() => {
    if (skipSnapshotRef.current) {
      skipSnapshotRef.current = false
      lastSnapshotRef.current = blocks
      return
    }
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current)
    snapshotTimer.current = setTimeout(() => {
      if (lastSnapshotRef.current !== blocks) {
        historyRef.current = [...historyRef.current.slice(-49), lastSnapshotRef.current]
        lastSnapshotRef.current = blocks
      }
    }, 600)
  }, [blocks])

  /* ── Ctrl+Z / Cmd+Z keyboard listener ───────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'z' || e.shiftKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return   // let browser handle native undo in text fields
      e.preventDefault()
      if (historyRef.current.length === 0) return
      const prev = historyRef.current[historyRef.current.length - 1]
      historyRef.current      = historyRef.current.slice(0, -1)
      skipSnapshotRef.current = true
      lastSnapshotRef.current = prev
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current)
      setBlocks(prev)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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

  const toggleHiddenBlock = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, hidden: !b.hidden } : b))
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

  const addSubTextToSelected = useCallback(() => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== selectedId) return b
      const texts = { ...(b.props.texts ?? {}) }
      const existing: string[] = (() => { try { return JSON.parse(texts['sub-texts'] ?? '[]') } catch { return [] } })()
      const newId = `st-${Date.now()}`
      texts['sub-texts'] = JSON.stringify([...existing, newId])
      texts[newId] = ''
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [selectedId])

  /* ── Layout row/cell operations ─────────────────────────── */
  const parseRows = (txt: Record<string, string>): LayoutRow[] => {
    try { return JSON.parse(txt['layout-rows'] ?? '[]') } catch { return [] }
  }

  const addLayoutRow = useCallback((blockId: string, cellType: 'text' | 'image' | 'list') => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts = { ...(b.props.texts ?? {}) }
      const rows  = parseRows(texts)
      const rowId  = `row-${Date.now()}`
      const cellId = `cell-${Date.now()}`
      const newRow: LayoutRow = { id: rowId, cols: 1, cells: [{ id: cellId, type: cellType }] }
      texts['layout-rows'] = JSON.stringify([...rows, newRow])
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [])

  const removeLayoutRow = useCallback((blockId: string, rowId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts = { ...(b.props.texts ?? {}) }
      texts['layout-rows'] = JSON.stringify(parseRows(texts).filter(r => r.id !== rowId))
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [])

  const setRowCols = useCallback((blockId: string, rowId: string, cols: 1 | 2 | 3) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts = { ...(b.props.texts ?? {}) }
      const rows  = parseRows(texts).map(r => {
        if (r.id !== rowId) return r
        const cells = [...r.cells]
        while (cells.length < cols) {
          cells.push({ id: `cell-${Date.now()}-${cells.length}`, type: 'empty' as CellType })
        }
        return { ...r, cols, cells: cells.slice(0, cols) }
      })
      texts['layout-rows'] = JSON.stringify(rows)
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [])

  const setCellType = useCallback((blockId: string, rowId: string, cellId: string, type: CellType) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts = { ...(b.props.texts ?? {}) }
      const rows  = parseRows(texts).map(r => {
        if (r.id !== rowId) return r
        return { ...r, cells: r.cells.map((c: LayoutCell) => c.id === cellId ? { ...c, type } : c) }
      })
      texts['layout-rows'] = JSON.stringify(rows)
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [])

  const clearCell = useCallback((blockId: string, rowId: string, cellId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts  = { ...(b.props.texts ?? {}) }
      const images = { ...(b.props.images ?? {}) }
      const rows   = parseRows(texts).map(r => {
        if (r.id !== rowId) return r
        return { ...r, cells: r.cells.map((c: LayoutCell) => c.id === cellId ? { ...c, type: 'empty' as CellType } : c) }
      })
      texts['layout-rows'] = JSON.stringify(rows)
      delete texts[cellId]
      delete texts[`${cellId}-items`]
      delete images[cellId]
      return { ...b, props: { ...b.props, texts, images } }
    }))
  }, [])

  const removeSubText = useCallback((blockId: string, subTextId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b
      const texts = { ...(b.props.texts ?? {}) }
      const existing: string[] = (() => { try { return JSON.parse(texts['sub-texts'] ?? '[]') } catch { return [] } })()
      texts['sub-texts'] = JSON.stringify(existing.filter(id => id !== subTextId))
      delete texts[subTextId]
      const STYLE_SUFFIXES = ['-font', '-size', '-color', '-bold', '-italic', '-align']
      STYLE_SUFFIXES.forEach(s => delete texts[`${subTextId}${s}`])
      return { ...b, props: { ...b.props, texts } }
    }))
  }, [])

  /* ── Context value ───────────────────────────────────── */
  const contextValue = useMemo(() => ({
    updateImage,
    getImage,
    updateText,
    getText,
    previewMode,
    selectedElement,
    setSelectedElement,
    selectedBlockId:      selectedId,
    addSubTextToSelected,
    removeSubText,
    addLayoutRow,
    removeLayoutRow,
    setRowCols,
    setCellType,
    clearCell,
  }), [updateImage, getImage, updateText, getText, previewMode, selectedElement, selectedId, addSubTextToSelected, removeSubText, addLayoutRow, removeLayoutRow, setRowCols, setCellType, clearCell])

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

  if (isSmallScreen) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          <Monitor size={26} className="text-brand-600" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 mb-1.5">Open on a larger screen</h2>
        <p className="text-sm text-stone-500 max-w-xs">
          The Website Builder needs more space to work properly. Please switch to a desktop or tablet to edit your page.
        </p>
      </div>
    )
  }

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
            onSharePreview={() => setShowPreviewShare(true)}
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
              onToggleHidden={toggleHiddenBlock}
              pageName={pageName}
              onNameChange={setPageName}
              pageHighlights={pageHighlights}
              pageLanguages={pageLanguages}
              onHighlightsChange={setPageHighlights}
              onLanguagesChange={setPageLanguages}
              pageAddress={pageAddress}
              onAddressChange={setPageAddress}
            />

            {!previewMode && <RightPanel />}
          </div>
        </div>

        <PreviewShareModal
          open={showPreviewShare}
          onClose={() => setShowPreviewShare(false)}
          blocks={blocks}
          slug={editSlug}
          pageName={pageName}
          pageAddress={pageAddress}
          pageLanguages={pageLanguages}
        />

        <PublishModal
          open={showPublish}
          onClose={() => setShowPublish(false)}
          builderData={{
            title:     pageName,
            hostName:  blocks.find(b => b.type === 'contact')?.props.texts?.['contact-host-name'] ?? '',
            phone:     blocks.find(b => b.type === 'contact')?.props.texts?.['contact-phone']    ?? '',
            whatsapp:  blocks.find(b => b.type === 'contact')?.props.texts?.['contact-whatsapp'] ?? '',
            email:     blocks.find(b => b.type === 'contact')?.props.texts?.['contact-email']    ?? '',
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
