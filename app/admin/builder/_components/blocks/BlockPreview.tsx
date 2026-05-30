'use client'

import React, { useState, useEffect } from 'react'
import type { CanvasBlock } from '../BuilderTypes'
import { ShieldCheck, MapPin, Ban, ScrollText, Globe2, X, Plus } from 'lucide-react'
import EditableImage from '../EditableImage'
import EditableText from '../EditableText'
import ActivityLogBlock from './ActivityLogBlock'
import { useBuilder } from '../BuilderContext'

/* ─── 1. HERO BLOCK ─────────────────────────────────────── */
function HeroPreview({ id }: { id: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
      <div className="w-full aspect-[16/9] overflow-hidden">
        <EditableImage
          blockId={id} imageKey="cover"
          defaultUrl="https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&q=70"
          wrapperClassName="w-full h-full"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-6 py-4">
        <EditableText
          blockId={id} textKey="tagline"
          defaultValue="Where the jungle meets your pillow."
          className="text-base text-stone-600 italic"
          as="p"
        />
      </div>
    </div>
  )
}

/* ─── 1b. CONTACT BLOCK ──────────────────────────────────── */
const PHONE_RE = /^\+[1-9]\d{6,14}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE   = /^https?:\/\/.+/

function validatePhone(v: string) { return PHONE_RE.test(v.replace(/\s/g, '')) ? null : 'Use international format: +91 9876543210' }
function validateEmail(v: string) { return EMAIL_RE.test(v) ? null : 'Enter a valid email address' }
function validateUrl(v: string)   { return URL_RE.test(v)   ? null : 'Must start with http:// or https://' }

function ContactFieldRow({
  blockId, textKey, showKey, label, placeholder, emoji,
  validate,
}: {
  blockId: string
  textKey: string
  showKey?: string
  label: string
  placeholder: string
  emoji: string
  validate?: (v: string) => string | null
}) {
  const { getText, updateText } = useBuilder()
  const [error, setError] = useState<string | null>(null)

  const value = getText(blockId, textKey, '')
  const show  = showKey ? getText(blockId, showKey, 'true') !== 'false' : true

  const handleBlur = () => {
    if (validate && value.trim()) setError(validate(value))
    else setError(null)
  }

  return (
    <div className="flex items-start gap-2 px-4 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-sm shrink-0 mt-1">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{label}</p>
        <input
          value={value}
          onChange={e => updateText(blockId, textKey, e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full text-sm text-stone-700 placeholder:text-stone-300 bg-transparent outline-none border-b pb-0.5 transition-colors ${
            error ? 'border-rose-300' : 'border-transparent focus:border-brand-300'
          }`}
        />
        {error && <p className="text-[10px] text-rose-500 mt-0.5">{error}</p>}
      </div>
      {showKey && (
        <label className="flex items-center gap-1 shrink-0 cursor-pointer pt-3.5">
          <input
            type="checkbox"
            checked={show}
            onChange={e => updateText(blockId, showKey, e.target.checked ? 'true' : 'false')}
            className="w-3.5 h-3.5 accent-brand-600"
          />
          <span className="text-[9px] text-stone-400">Show</span>
        </label>
      )}
    </div>
  )
}

function ContactPreview({ id }: { id: string }) {
  const { getText, previewMode } = useBuilder()

  if (previewMode) {
    const name    = getText(id, 'contact-host-name', 'Host Name')
    const phone   = getText(id, 'contact-phone', '') || getText(id, 'contact-whatsapp', '')
    const email   = getText(id, 'contact-email', '')
    const address = getText(id, 'contact-address', '')
    const window_ = getText(id, 'contact-calling-window', '')

    const socials = [
      getText(id, 'contact-website',   '') && getText(id, 'contact-website-show',   'true') !== 'false' && { label: '🌐' },
      getText(id, 'contact-instagram', '') && getText(id, 'contact-instagram-show', 'true') !== 'false' && { label: '📸' },
      getText(id, 'contact-facebook',  '') && getText(id, 'contact-facebook-show',  'true') !== 'false' && { label: '👤' },
      getText(id, 'contact-youtube',   '') && getText(id, 'contact-youtube-show',   'true') !== 'false' && { label: '▶️' },
    ].filter(Boolean) as { label: string }[]

    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
        <p className="font-semibold text-stone-900 text-base">{name}</p>
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 space-y-3">
          <div className="flex items-center gap-3 w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-xl">
            <WAIcon size={18} />
            <span className="flex-1 text-sm">Chat with Host on WhatsApp</span>
          </div>
          {(phone || email || address || window_) && (
            <div className="space-y-1.5 pt-1">
              {phone   && <p className="text-xs text-stone-500">📞 {phone}</p>}
              {email   && <p className="text-xs text-stone-500">✉️ {email}</p>}
              {address && <p className="text-xs text-stone-500">📍 {address}</p>}
              {window_ && <p className="text-xs text-stone-500">🕐 Best time: {window_}</p>}
            </div>
          )}
          {socials.length > 0 && (
            <div className="flex gap-2 pt-1 border-t border-green-100">
              {socials.map((s, i) => (
                <span key={i} className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">{s.label}</span>
              ))}
            </div>
          )}
        </div>
        <p className="text-[10px] text-stone-400 text-center">Shown after login + code of conduct on live site</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex items-center gap-2">
        <ShieldCheck size={13} className="text-brand-500" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
          Contact Card — shown after login + code of conduct
        </span>
      </div>

      {/* Host name — always visible, no toggle */}
      <div className="bg-amber-50/50 border-b border-stone-100">
        <ContactFieldRow
          blockId={id} textKey="contact-host-name"
          label="Host Name (always visible)" placeholder="e.g. Meena Patil" emoji="👤"
        />
      </div>

      {/* Contact fields */}
      <ContactFieldRow blockId={id} textKey="contact-phone"        showKey="contact-phone-show"        label="Phone"          placeholder="+91 98765 43210"     emoji="📞" validate={validatePhone} />
      <ContactFieldRow blockId={id} textKey="contact-whatsapp"     showKey="contact-whatsapp-show"     label="WhatsApp"       placeholder="+91 98765 43210"     emoji="💬" validate={validatePhone} />
      <ContactFieldRow blockId={id} textKey="contact-alt-phone"    showKey="contact-alt-phone-show"    label="Alt Phone"      placeholder="+91 98765 43210"     emoji="📱" validate={validatePhone} />
      <ContactFieldRow blockId={id} textKey="contact-alt-whatsapp" showKey="contact-alt-whatsapp-show" label="Alt WhatsApp"   placeholder="+91 98765 43210"     emoji="💬" validate={validatePhone} />
      <ContactFieldRow blockId={id} textKey="contact-email"        showKey="contact-email-show"        label="Email"          placeholder="host@example.com"    emoji="✉️" validate={validateEmail} />
      <ContactFieldRow blockId={id} textKey="contact-address"      showKey="contact-address-show"      label="Address"        placeholder="Village, District"   emoji="📍" />
      <ContactFieldRow blockId={id} textKey="contact-calling-window" showKey="contact-calling-window-show" label="Calling Window" placeholder="5 PM – 8 PM"    emoji="🕐" />

      {/* Social links */}
      <div className="border-t border-stone-200">
        <div className="bg-stone-50 border-b border-stone-100 px-4 py-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Social &amp; Web Links (icon only)</span>
        </div>
        <ContactFieldRow blockId={id} textKey="contact-website"   showKey="contact-website-show"   label="Website"   placeholder="https://yoursite.com"      emoji="🌐" validate={validateUrl} />
        <ContactFieldRow blockId={id} textKey="contact-instagram" showKey="contact-instagram-show" label="Instagram" placeholder="https://instagram.com/..."  emoji="📸" validate={validateUrl} />
        <ContactFieldRow blockId={id} textKey="contact-facebook"  showKey="contact-facebook-show"  label="Facebook"  placeholder="https://facebook.com/..."   emoji="👤" validate={validateUrl} />
        <ContactFieldRow blockId={id} textKey="contact-youtube"   showKey="contact-youtube-show"   label="YouTube"   placeholder="https://youtube.com/..."    emoji="▶️" validate={validateUrl} />
      </div>
    </div>
  )
}

/* ─── 2. HOST STORY ──────────────────────────────────────── */
const SHAPE_OPTIONS   = [
  { value: 'circle',  label: '●', title: 'Circle'  },
  { value: 'rounded', label: '▢', title: 'Rounded' },
  { value: 'square',  label: '■', title: 'Square'  },
] as const

const POSITION_GRID = [
  ['top-left',    'top',    'top-right'   ],
  ['left',        'center', 'right'       ],
  ['bottom-left', 'bottom', 'bottom-right'],
]

const SHAPE_CLASS: Record<string, string> = {
  circle:  'rounded-full',
  rounded: 'rounded-2xl',
  square:  'rounded-none',
}

const POSITION_CLASS: Record<string, string> = {
  'top-left':    'object-left-top',
  'top':         'object-top',
  'top-right':   'object-right-top',
  'left':        'object-left',
  'center':      'object-center',
  'right':       'object-right',
  'bottom-left': 'object-left-bottom',
  'bottom':      'object-bottom',
  'bottom-right':'object-right-bottom',
}

// Transform origin so zoom expands from the crop point
const ORIGIN_MAP: Record<string, string> = {
  'top-left':    '0% 0%',
  'top':         '50% 0%',
  'top-right':   '100% 0%',
  'left':        '0% 50%',
  'center':      '50% 50%',
  'right':       '100% 50%',
  'bottom-left': '0% 100%',
  'bottom':      '50% 100%',
  'bottom-right':'100% 100%',
}

function HostPhotoEditor({ id }: { id: string }) {
  const { getText, updateText, previewMode } = useBuilder()
  const [hovered, setHovered] = useState(false)

  const shape    = getText(id, 'host-shape',    'circle')
  const position = getText(id, 'host-position', 'center')
  const zoom     = parseFloat(getText(id, 'host-zoom', '1'))

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => { if (!previewMode) setHovered(true)  }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <div className={`w-20 h-20 border-2 border-stone-200 overflow-hidden ${SHAPE_CLASS[shape] ?? 'rounded-full'}`}>
        <div
          className="w-full h-full"
          style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: ORIGIN_MAP[position] ?? '50% 50%' }}
        >
          <EditableImage
            blockId={id} imageKey="host-photo"
            defaultUrl="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&q=70"
            wrapperClassName="w-full h-full"
            className={`w-full h-full object-cover ${POSITION_CLASS[position] ?? 'object-center'}`}
          />
        </div>
      </div>

      {/* Controls panel */}
      {hovered && (
        <div
          className="absolute left-full top-0 ml-2.5 z-30 bg-white border border-stone-200 rounded-xl shadow-xl p-3 space-y-2.5 w-28"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Shape */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Shape</p>
            <div className="flex gap-1">
              {SHAPE_OPTIONS.map(s => (
                <button
                  key={s.value}
                  title={s.title}
                  onClick={() => updateText(id, 'host-shape', s.value)}
                  className={`flex-1 py-1 text-sm rounded-lg font-bold transition-colors ${
                    shape === s.value
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop position */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Crop area</p>
            <div className="grid grid-cols-3 gap-0.5">
              {POSITION_GRID.flat().map(pos => (
                <button
                  key={pos}
                  title={pos}
                  onClick={() => updateText(id, 'host-position', pos)}
                  className={`h-6 rounded flex items-center justify-center transition-colors ${
                    position === pos ? 'bg-brand-500' : 'bg-stone-100 hover:bg-stone-200'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${position === pos ? 'bg-white' : 'bg-stone-400'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Zoom</p>
              <span className="text-[9px] font-semibold text-brand-600">{zoom.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min="1" max="3" step="0.1"
              value={zoom}
              onChange={e => updateText(id, 'host-zoom', e.target.value)}
              className="w-full h-1.5 rounded-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-stone-300 mt-0.5">
              <span>1×</span><span>3×</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HostStoryPreview({ id }: { id: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 flex flex-col sm:flex-row gap-6">
      <HostPhotoEditor id={id} />
      <div className="space-y-2">
        <EditableText
          blockId={id} textKey="story-title"
          defaultValue="Our Story — The Patil Family"
          className="text-base font-semibold text-stone-900"
          as="h2"
        />
        <EditableText
          blockId={id} textKey="story-body"
          defaultValue="We've farmed this land for three generations. In 2012, we opened our home to travelers — not as a business, but as a way of sharing the life we love."
          multiline
          className="text-sm text-stone-600 leading-relaxed"
          as="p"
        />
      </div>
    </div>
  )
}

/* ─── 4. RULES BLOCK ─────────────────────────────────────── */
const DEFAULT_POLICIES = [
  'Check-in after 2:00 PM, check-out by 11:00 AM',
  'Quiet hours after 10:00 PM',
  'No smoking inside the house',
  'Traditional attire near prayer areas',
]
const DEFAULT_PROHIBITED = ['Single-use plastics', 'Outside alcohol', 'Loud music']

function EditableList({
  items,
  onAdd,
  onRemove,
  onEdit,
  icon,
  previewMode,
}: {
  items: string[]
  onAdd: (val: string) => void
  onRemove: (i: number) => void
  onEdit: (i: number, val: string) => void
  icon: React.ReactNode
  previewMode: boolean
}) {
  const [draft, setDraft] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')

  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 group/item">
          <span className="mt-1 shrink-0">{icon}</span>
          {!previewMode && editingIdx === i ? (
            <input
              autoFocus
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              onBlur={() => { onEdit(i, editDraft); setEditingIdx(null) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { onEdit(i, editDraft); setEditingIdx(null) }
                if (e.key === 'Escape') setEditingIdx(null)
              }}
              className="flex-1 text-xs bg-brand-50 border border-brand-300 rounded px-1.5 py-0.5 outline-none"
            />
          ) : (
            <span
              className={`flex-1 text-xs text-stone-700 leading-snug ${!previewMode ? 'cursor-text hover:text-brand-700' : ''}`}
              onClick={() => { if (!previewMode) { setEditingIdx(i); setEditDraft(item) } }}
            >
              {item}
            </span>
          )}
          {!previewMode && editingIdx !== i && (
            <button
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover/item:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity shrink-0 mt-0.5"
            >
              <X size={11} />
            </button>
          )}
        </li>
      ))}
      {!previewMode && (
        <li className="flex items-center gap-1.5 mt-1.5">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && draft.trim()) { onAdd(draft.trim()); setDraft('') }
            }}
            placeholder="Add item… (Enter to save)"
            className="flex-1 text-[11px] bg-stone-50 border border-dashed border-stone-300 rounded-lg px-2.5 py-1.5 outline-none placeholder:text-stone-300 focus:border-brand-400 focus:bg-brand-50 transition-colors"
          />
        </li>
      )}
    </ul>
  )
}

function RulesBlockPreview({ id }: { id: string }) {
  const { getText, updateText, previewMode } = useBuilder()

  const getPolicies = (): string[] => {
    try { return JSON.parse(getText(id, 'policies', JSON.stringify(DEFAULT_POLICIES))) } catch { return DEFAULT_POLICIES }
  }
  const getProhibited = (): string[] => {
    try { return JSON.parse(getText(id, 'prohibited', JSON.stringify(DEFAULT_PROHIBITED))) } catch { return DEFAULT_PROHIBITED }
  }

  const policies   = getPolicies()
  const prohibited = getProhibited()

  const savePolicies   = (next: string[]) => updateText(id, 'policies',   JSON.stringify(next))
  const saveProhibited = (next: string[]) => updateText(id, 'prohibited', JSON.stringify(next))

  // Persist defaults on first mount so publish always has data
  useEffect(() => {
    if (!getText(id, 'policies',   '')) updateText(id, 'policies',   JSON.stringify(DEFAULT_POLICIES))
    if (!getText(id, 'prohibited', '')) updateText(id, 'prohibited', JSON.stringify(DEFAULT_PROHIBITED))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ScrollText size={18} className="text-stone-500" />
        <h2 className="font-semibold text-stone-900">House Rules & Safety</h2>
      </div>
      <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <ShieldCheck size={16} className="text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800">Verified safe for solo female travelers</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">House policies</p>
        <EditableList
          items={policies}
          previewMode={previewMode}
          icon={<span className="w-1.5 h-1.5 bg-stone-400 rounded-full mt-2 block" />}
          onAdd={val => savePolicies([...policies, val])}
          onRemove={i => savePolicies(policies.filter((_, idx) => idx !== i))}
          onEdit={(i, val) => { const next = [...policies]; next[i] = val; savePolicies(next) }}
        />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Please do not bring</p>
        <EditableList
          items={prohibited}
          previewMode={previewMode}
            icon={<Ban size={10} className="text-rose-400 mt-0.5" />}
            onAdd={val => saveProhibited([...prohibited, val])}
            onRemove={i => saveProhibited(prohibited.filter((_, idx) => idx !== i))}
            onEdit={(i, val) => { const next = [...prohibited]; next[i] = val; saveProhibited(next) }}
          />
      </div>
    </div>
  )
}

/* ─── 5. VIDEO BLOCK ─────────────────────────────────────── */
function YoutubeUrlInput({ blockId }: { blockId: string }) {
  const { getText, updateText } = useBuilder()
  const value = getText(blockId, 'youtube-url', '')
  return (
    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest shrink-0">YouTube</span>
      <input
        type="text"
        value={value}
        onChange={e => updateText(blockId, 'youtube-url', e.target.value || null)}
        placeholder="Paste YouTube link…"
        className="flex-1 bg-transparent text-[11px] text-brand-600 placeholder:text-stone-300 outline-none min-w-0"
      />
    </div>
  )
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch {}
  return null
}

function VideoPreview({ id }: { id: string }) {
  const { getText, previewMode } = useBuilder()
  const ytUrl = getText(id, 'youtube-url', '')
  const videoId = ytUrl ? extractYouTubeId(ytUrl) : null

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-950">
      {/* Embed or placeholder */}
      {videoId ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 py-8">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[12px] border-transparent border-l-white ml-0.5" />
          </div>
          <p className="text-[11px] text-white/40 font-medium">Paste a YouTube link below</p>
        </div>
      )}

      {/* YouTube URL + caption */}
      {!previewMode && (
        <div className="bg-white border-t border-stone-100 px-4 py-2.5">
          <YoutubeUrlInput blockId={id} />
        </div>
      )}
    </div>
  )
}

/* ─── 6. GALLERY ─────────────────────────────────────────── */
type GalleryRatio = 'square' | 'landscape' | 'portrait'
type GalleryItem  = { key: string; ratio: GalleryRatio }

const RATIO_OPTIONS: { value: GalleryRatio; label: string }[] = [
  { value: 'square',    label: '1:1'  },
  { value: 'landscape', label: '16:9' },
  { value: 'portrait',  label: '3:4'  },
]

const RATIO_CLASS: Record<GalleryRatio, string> = {
  square:    'aspect-square',
  landscape: 'aspect-video',
  portrait:  'aspect-[3/4]',
}

const DEFAULT_META: GalleryItem[] = [
  { key: 'gallery-0', ratio: 'square'    },
  { key: 'gallery-1', ratio: 'landscape' },
  { key: 'gallery-2', ratio: 'square'    },
  { key: 'gallery-3', ratio: 'portrait'  },
  { key: 'gallery-4', ratio: 'square'    },
  { key: 'gallery-5', ratio: 'square'    },
]

const GALLERY_PLACEHOLDER = 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=300&q=60'

function GalleryPreview({ id }: { id: string }) {
  const { getText, updateText, updateImage, previewMode } = useBuilder()

  const getMeta = (): GalleryItem[] => {
    try {
      const raw = getText(id, 'gallery-meta', '')
      if (raw) return JSON.parse(raw)
    } catch {}
    return DEFAULT_META
  }

  const meta = getMeta()

  const saveMeta = (items: GalleryItem[]) =>
    updateText(id, 'gallery-meta', JSON.stringify(items))

  // Persist DEFAULT_META immediately so publish always has keys to map
  useEffect(() => {
    const raw = getText(id, 'gallery-meta', '')
    if (!raw) saveMeta(DEFAULT_META)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const addSlot = () => {
    const key = `gallery-${Date.now()}`
    saveMeta([...meta, { key, ratio: 'square' }])
  }

  const deleteSlot = (key: string) => {
    saveMeta(meta.filter(m => m.key !== key))
    updateImage(id, key, null)
  }

  const setRatio = (key: string, ratio: GalleryRatio) =>
    saveMeta(meta.map(m => m.key === key ? { ...m, ratio } : m))

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-900">Photo Gallery</h2>
        {!previewMode && (
          <button
            onClick={addSlot}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus size={12} /> Add Photo
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 items-start grid-flow-row-dense">
        {meta.map(item => (
          <div
            key={item.key}
            className={`relative group/slot overflow-hidden rounded-lg ${RATIO_CLASS[item.ratio]} ${
              item.ratio === 'landscape' ? 'col-span-3' : 'col-span-1'
            }`}
          >
            <EditableImage
              blockId={id} imageKey={item.key}
              defaultUrl={GALLERY_PLACEHOLDER}
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover"
            />

            {!previewMode && (
              <>
                {/* Delete slot */}
                <button
                  onClick={e => { e.stopPropagation(); deleteSlot(item.key) }}
                  className="absolute top-1 right-1 z-30 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow"
                >
                  <X size={9} />
                </button>

                {/* Ratio selector */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 flex gap-0.5 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                  {RATIO_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      onClick={e => { e.stopPropagation(); setRatio(item.key, r.value) }}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                        item.ratio === r.value
                          ? 'bg-white text-stone-900 shadow'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── 7. ROOMS ───────────────────────────────────────────── */
const ROOM_DEFAULTS = [
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=300&q=60',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=60',
]

function RoomsPreview({ id }: { id: string }) {
  const rooms = [
    { key: 'room-0', name: 'Garden Room',  guests: '2 guests · 1 bed', price: '₹2,400 / night' },
    { key: 'room-1', name: 'Forest Suite', guests: '4 guests · 2 beds', price: '₹3,800 / night' },
  ]
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
      <h2 className="text-base font-semibold text-stone-900">Rooms & Accommodation</h2>
      <div className="space-y-3">
        {rooms.map((r, i) => (
          <div key={r.key} className="flex gap-4 border border-stone-100 rounded-xl overflow-hidden">
            <EditableImage
              blockId={id} imageKey={r.key}
              defaultUrl={ROOM_DEFAULTS[i]}
              wrapperClassName="w-24 shrink-0"
              className="w-full h-full object-cover"
            />
            <div className="py-3 pr-4 space-y-1">
              <p className="text-sm font-semibold text-stone-900">{r.name}</p>
              <p className="text-xs text-stone-500">{r.guests}</p>
              <p className="text-sm font-bold text-brand-600">{r.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── 9. REVIEWS ─────────────────────────────────────────── */
function ReviewsPreview() {
  const reviews = [
    { name: 'Priya M.', initials: 'P', rating: 5, date: 'Apr 2025', text: "Absolutely magical! The birding at dawn was unforgettable. Meena's cooking is the best I've ever had." },
    { name: 'Rahul K.', initials: 'R', rating: 5, date: 'Mar 2025', text: 'A true escape from city life. Clean rooms, warm hospitality, and stunning nature all around.' },
  ]
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-stone-900">Community Reviews</h2>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          <span className="text-amber-400 text-sm">★</span>
          <span className="text-sm font-semibold text-amber-800">4.9</span>
          <span className="text-xs text-amber-600">(24 reviews)</span>
        </div>
      </div>
      <div className="space-y-5">
        {reviews.map(r => (
          <div key={r.name} className="border-b border-stone-100 pb-5 last:border-0 last:pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                {r.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">{r.name}</p>
                <p className="text-xs text-stone-400">{r.date}</p>
              </div>
              <div className="ml-auto text-amber-400 text-xs">{'★'.repeat(r.rating)}</div>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed ml-11">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── 10. FOOD SECTION ───────────────────────────────────── */
const FOOD_DEFAULTS = [
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&q=60',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=60',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=60',
]

function FoodPreview({ id }: { id: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 flex gap-5 items-start">
      <div className="flex-1 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Farm to Table</p>
        <h2 className="text-base font-semibold text-stone-900">Authentic Home Cooking</h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Fresh vegetables from our garden, traditional recipes passed through generations.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['Breakfast', 'Lunch', 'Dinner'].map(m => (
            <span key={m} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full">{m}</span>
          ))}
        </div>
      </div>
      <div className="w-28 shrink-0">
        <div className="grid grid-cols-2 gap-1">
          <EditableImage
            blockId={id} imageKey="food-0"
            defaultUrl={FOOD_DEFAULTS[0]}
            wrapperClassName="col-span-2 aspect-video overflow-hidden rounded-lg"
            className="w-full h-full object-cover"
          />
          <EditableImage
            blockId={id} imageKey="food-1"
            defaultUrl={FOOD_DEFAULTS[1]}
            wrapperClassName="aspect-square overflow-hidden rounded-lg"
            className="w-full h-full object-cover"
          />
          <EditableImage
            blockId={id} imageKey="food-2"
            defaultUrl={FOOD_DEFAULTS[2]}
            wrapperClassName="aspect-square overflow-hidden rounded-lg"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── WhatsApp SVG icon ──────────────────────────────────── */
function WAIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/* ─── 11. WHATSAPP CTA ───────────────────────────────────── */
function WhatsappPreview() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-green-600" />
          <span className="text-sm font-semibold text-green-800">Verified Host</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          Usually responds within 2 hrs
        </div>
      </div>
      <div className="flex items-center gap-3 w-full bg-green-500 text-white font-semibold py-3 px-5 rounded-xl shadow-md shadow-green-200/60">
        <WAIcon size={20} />
        <span className="flex-1 text-sm">Chat with Host on WhatsApp</span>
      </div>
      <p className="text-[10px] text-stone-400 text-center">
        Opens WhatsApp with a pre-filled message · Number never shown publicly
      </p>
    </div>
  )
}

/* ─── 12. MAP ────────────────────────────────────────────── */
function MapPreview({ id }: { id: string }) {
  const { getText, previewMode } = useBuilder()

  const location   = getText(id, 'map-location',    'Village, District')
  const region     = getText(id, 'map-region',      'State, India')
  const nearestTown = getText(id, 'map-nearest-town', 'Nearest town info')

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-brand-600" />
        <h2 className="text-base font-semibold text-stone-900">Location</h2>
      </div>

      {/* Map placeholder */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-green-100 via-green-50 to-stone-100 border border-stone-200" style={{ height: 140 }}>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-1.5">
          <span className="text-3xl">📍</span>
          <EditableText
            blockId={id} textKey="map-location"
            defaultValue="Village, District"
            className="text-sm font-semibold text-stone-700 text-center"
            as="p"
          />
          <EditableText
            blockId={id} textKey="map-region"
            defaultValue="State, India"
            className="text-xs text-stone-400 text-center"
            as="p"
          />
        </div>
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[20,40,60,80].map(v => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#16a34a" strokeWidth="0.5"/>
              <line x1="0" y1={v} x2="100" y2={v} stroke="#16a34a" strokeWidth="0.5"/>
            </g>
          ))}
        </svg>
      </div>

      {/* Nearest town */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Globe2 size={14} className="text-stone-400 shrink-0" />
        <EditableText
          blockId={id} textKey="map-nearest-town"
          defaultValue="Nearest town info"
          className="text-sm text-stone-500"
          as="span"
        />
      </div>

      {!previewMode && (
        <p className="text-[10px] text-stone-300 italic">
          Exact coordinates are set via the Publish → Pick on Map flow
        </p>
      )}
    </div>
  )
}

/* ─── Sub-texts section (available in every block) ──────── */
function SubTextsSection({ blockId }: { blockId: string }) {
  const { getText, previewMode, removeSubText } = useBuilder()

  const ids: string[] = (() => {
    try { return JSON.parse(getText(blockId, 'sub-texts', '[]')) } catch { return [] }
  })()

  if (ids.length === 0) return null

  return (
    <div className="space-y-2 mt-3 px-1">
      {ids.map(id => (
        <div key={id} className="relative group/st">
          <EditableText
            blockId={blockId}
            textKey={id}
            defaultValue="Click to write…"
            multiline
            className="text-sm text-stone-600 leading-relaxed w-full min-h-[2rem]"
            as="p"
          />
          {!previewMode && (
            <button
              onClick={e => { e.stopPropagation(); removeSubText(blockId, id) }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/st:opacity-100 transition-opacity text-[10px] leading-none z-10"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Main Switch ────────────────────────────────────────── */
function BlockContent({ block }: { block: CanvasBlock }) {
  const id = block.id
  switch (block.type) {
    case 'hero':         return <HeroPreview id={id} />
    case 'contact':      return <ContactPreview id={id} />
    case 'host-story':   return <HostStoryPreview id={id} />
    case 'activity-log': return <ActivityLogBlock blockId={id} />
    case 'rules-block':  return <RulesBlockPreview id={id} />
    case 'video':        return <VideoPreview id={id} />
    case 'gallery':      return <GalleryPreview id={id} />
    case 'rooms':        return <RoomsPreview id={id} />
    case 'reviews':      return <ReviewsPreview />
    case 'food':         return <FoodPreview id={id} />
    case 'whatsapp':     return <WhatsappPreview />
    case 'map':          return <MapPreview id={id} />
    default:             return null
  }
}

export default function BlockPreview({ block }: { block: CanvasBlock }) {
  return (
    <div className="transition-all duration-200">
      <BlockContent block={block} />
      <SubTextsSection blockId={block.id} />
    </div>
  )
}
