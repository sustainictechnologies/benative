'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Trash2, ChevronUp, ChevronDown, Copy, Eye, EyeOff } from 'lucide-react'
import BlockPreview from './blocks/BlockPreview'
import type { CanvasBlock } from './BuilderTypes'
import { PALETTE } from './BuilderTypes'

interface Props {
  block: CanvasBlock
  selected: boolean
  onSelect: () => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDuplicate?: () => void
  onToggleHidden?: () => void
}

export default function CanvasBlockItem({
  block, selected, onSelect, onRemove, onMoveUp, onMoveDown, onDuplicate, onToggleHidden,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { source: 'canvas', block } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const meta = PALETTE.find(p => p.type === block.type)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`relative group cursor-pointer transition-all ${
        selected
          ? 'ring-2 ring-brand-500 ring-offset-2 rounded-sm'
          : 'hover:ring-1 hover:ring-stone-300 hover:ring-offset-1 rounded-sm'
      } ${block.hidden ? 'opacity-50' : ''}`}
    >
      {/* Section label */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 left-2 flex items-center gap-1.5 bg-brand-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg z-20 shadow-sm"
          >
            <span>{meta?.emoji}</span>
            <span>{meta?.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 flex items-center justify-center rounded-lg cursor-grab active:cursor-grabbing transition-all ${
          selected
            ? 'bg-brand-100 text-brand-600 opacity-100'
            : 'bg-white/80 text-stone-400 opacity-0 group-hover:opacity-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={13} />
      </div>

      {/* Toolbar (right side) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onMoveUp}
              className="w-6 h-6 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 hover:text-brand-600 hover:border-brand-300 transition-colors shadow-sm"
            >
              <ChevronUp size={11} />
            </button>
            <button
              onClick={onDuplicate}
              className="w-6 h-6 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 hover:text-brand-600 hover:border-brand-300 transition-colors shadow-sm"
            >
              <Copy size={11} />
            </button>
            <button
              onClick={onMoveDown}
              className="w-6 h-6 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 hover:text-brand-600 hover:border-brand-300 transition-colors shadow-sm"
            >
              <ChevronDown size={11} />
            </button>
            <button
              onClick={onToggleHidden}
              title={block.hidden ? 'Show section' : 'Hide section'}
              className="w-6 h-6 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 hover:text-brand-600 hover:border-brand-300 transition-colors shadow-sm"
            >
              {block.hidden ? <Eye size={11} /> : <EyeOff size={11} />}
            </button>
            <button
              onClick={onRemove}
              className="w-6 h-6 bg-white border border-red-100 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
            >
              <Trash2 size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block content */}
      <BlockPreview block={block} />
    </motion.div>
  )
}
