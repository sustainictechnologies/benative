'use client'

import { motion } from 'framer-motion'
import { Type, Image as ImageIcon, MousePointer2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { useBuilder } from './BuilderContext'

const FONTS = ['Inter', 'Playfair Display', 'Lora', 'DM Sans', 'Merriweather']

/* ─── Reusable controls ──────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">{children}</p>
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-2.5 border-b border-stone-100 last:border-0">{children}</div>
}

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200">
      <Icon size={13} className="text-brand-600" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{label}</span>
    </div>
  )
}

/* ─── Text controls ──────────────────────────────────────── */
function TextControls({ blockId, textKey }: { blockId: string; textKey: string }) {
  const { getText, updateText } = useBuilder()

  const font   = getText(blockId, `${textKey}-font`,   'Inter')
  const size   = getText(blockId, `${textKey}-size`,   '14')
  const color  = getText(blockId, `${textKey}-color`,  '#1c1c1c')
  const bold   = getText(blockId, `${textKey}-bold`,   'false') === 'true'
  const italic = getText(blockId, `${textKey}-italic`, 'false') === 'true'
  const align  = getText(blockId, `${textKey}-align`,  'left')

  return (
    <div>
      <SectionHeader icon={Type} label="Text Style" />

      <Row>
        <Label>Font family</Label>
        <select
          value={font}
          onChange={e => updateText(blockId, `${textKey}-font`, e.target.value)}
          className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-700 focus:outline-none focus:border-brand-400"
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Row>

      <Row>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Font size</Label>
          <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{size}px</span>
        </div>
        <input
          type="range" min={10} max={72} value={Number(size)}
          onChange={e => updateText(blockId, `${textKey}-size`, e.target.value)}
          className="w-full h-1.5 rounded-full accent-brand-600 cursor-pointer"
        />
        <div className="flex justify-between text-[8px] text-stone-300 mt-0.5">
          <span>10px</span><span>72px</span>
        </div>
      </Row>

      <Row>
        <Label>Color</Label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="color" value={color}
              onChange={e => updateText(blockId, `${textKey}-color`, e.target.value)}
              className="sr-only"
            />
            <div
              className="w-7 h-7 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
              style={{ background: color }}
            />
          </label>
          <span className="text-[10px] font-mono text-stone-400">{color}</span>
        </div>
      </Row>

      <Row>
        <Label>Style</Label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateText(blockId, `${textKey}-bold`, bold ? 'false' : 'true')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${bold ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            B
          </button>
          <button
            onClick={() => updateText(blockId, `${textKey}-italic`, italic ? 'false' : 'true')}
            className={`px-3 py-1.5 rounded-lg text-xs italic transition-colors ${italic ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
          >
            I
          </button>
        </div>
      </Row>

      <Row>
        <Label>Alignment</Label>
        <div className="flex items-center gap-1.5">
          {(['left', 'center', 'right'] as const).map((a, i) => {
            const Icon = [AlignLeft, AlignCenter, AlignRight][i]
            return (
              <button
                key={a}
                onClick={() => updateText(blockId, `${textKey}-align`, a)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-colors ${align === a ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
              >
                <Icon size={13} />
              </button>
            )
          })}
        </div>
      </Row>

      <div className="px-4 pt-2 pb-3">
        <p className="text-[9px] text-stone-300 font-mono truncate">
          key: {textKey}
        </p>
      </div>
    </div>
  )
}

/* ─── Image controls ─────────────────────────────────────── */
function ImageControls({ blockId, imageKey }: { blockId: string; imageKey: string }) {
  const { getText, updateText } = useBuilder()
  const fit = getText(blockId, `${imageKey}-fit`, 'cover')

  return (
    <div>
      <SectionHeader icon={ImageIcon} label="Image Style" />
      <Row>
        <Label>Object fit</Label>
        <div className="flex gap-1.5">
          {(['cover', 'contain', 'fill'] as const).map(f => (
            <button
              key={f}
              onClick={() => updateText(blockId, `${imageKey}-fit`, f)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors ${fit === f ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </Row>
      <div className="px-4 pt-2 pb-3">
        <p className="text-[9px] text-stone-300 font-mono truncate">key: {imageKey}</p>
      </div>
    </div>
  )
}

/* ─── Empty state ────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
        <MousePointer2 size={18} className="text-stone-400" />
      </div>
      <div>
        <p className="text-xs font-semibold text-stone-500 mb-1">No element selected</p>
        <p className="text-[10px] text-stone-400 leading-relaxed">
          Click any text or image on the canvas to edit its style here.
        </p>
      </div>
    </div>
  )
}

/* ─── Main Panel ─────────────────────────────────────────── */
export default function RightPanel() {
  const { selectedElement } = useBuilder()

  return (
    <motion.aside
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="w-60 bg-white border-l border-stone-200 flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50 shrink-0">
        <p className="text-xs font-bold text-stone-800">Properties</p>
        <p className="text-[10px] text-stone-400">
          {selectedElement
            ? selectedElement.type === 'text'  ? `Text · ${selectedElement.textKey}`
            : selectedElement.type === 'image' ? `Image · ${selectedElement.imageKey}`
            : 'Element'
            : 'Select an element'
          }
        </p>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto">
        {!selectedElement && <EmptyState />}

        {selectedElement?.type === 'text' && (
          <TextControls
            blockId={selectedElement.blockId}
            textKey={selectedElement.textKey}
          />
        )}

        {selectedElement?.type === 'image' && (
          <ImageControls
            blockId={selectedElement.blockId}
            imageKey={selectedElement.imageKey}
          />
        )}
      </div>
    </motion.aside>
  )
}
