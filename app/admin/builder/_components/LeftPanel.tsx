'use client'

import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { GripVertical, Layers, Type } from 'lucide-react'
import { PALETTE } from './BuilderTypes'
import type { BlockType } from './BuilderTypes'
import { useBuilder } from './BuilderContext'

function PaletteItem({ type, label, emoji, desc }: {
  type: BlockType; label: string; emoji: string; desc: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', blockType: type },
  })

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-100 bg-white hover:border-brand-200 hover:bg-brand-50 cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <span className="text-base shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-800 leading-none mb-0.5">{label}</p>
        <p className="text-[10px] text-stone-400 truncate">{desc}</p>
      </div>
      <GripVertical size={13} className="text-stone-300 group-hover:text-brand-400 shrink-0 transition-colors" />
    </motion.div>
  )
}

function AddTextButton() {
  const { addSubTextToSelected, selectedBlockId } = useBuilder()
  const disabled = !selectedBlockId

  return (
    <motion.button
      whileHover={disabled ? {} : { x: 2 }}
      transition={{ duration: 0.12 }}
      onClick={addSubTextToSelected}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all select-none text-left ${
        disabled
          ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
          : 'border-stone-100 bg-white hover:border-brand-200 hover:bg-brand-50 cursor-pointer'
      }`}
    >
      <Type size={16} className={disabled ? 'text-stone-300' : 'text-brand-500'} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-800 leading-none mb-0.5">Text</p>
        <p className="text-[10px] text-stone-400 truncate">
          {disabled ? 'Select a block first' : 'Add paragraph to selected block'}
        </p>
      </div>
    </motion.button>
  )
}

export default function LeftPanel() {
  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="w-56 bg-stone-50 border-r border-stone-200 flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-stone-200 flex items-center gap-2">
        <Layers size={14} className="text-brand-600" />
        <span className="text-xs font-bold text-stone-800">Sections</span>
        <span className="ml-auto text-[10px] text-stone-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{PALETTE.length}</span>
      </div>

      {/* Instruction */}
      <div className="mx-3 mt-2.5 mb-1 p-2 rounded-lg bg-brand-50 border border-brand-100">
        <p className="text-[10px] text-brand-700 leading-relaxed">
          <span className="font-semibold">Drag</span> sections onto the canvas to add them.
        </p>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Block palette */}
        {(['Core', 'Extra'] as const).map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 px-1">
              {group === 'Core' ? '⚡ Core Blocks' : '➕ Extra Sections'}
            </p>
            <div className="space-y-1.5">
              {PALETTE.filter(p => p.group === group).map((item, i) => (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <PaletteItem {...item} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Elements — added to selected block */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 px-1">
            ✏️ Elements
          </p>
          <p className="text-[10px] text-stone-400 px-1 mb-2 leading-relaxed">
            Click to add inside the selected block.
          </p>
          <AddTextButton />
        </div>

      </div>
    </motion.aside>
  )
}
