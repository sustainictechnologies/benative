'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X, ShieldCheck, Leaf, Users, Compass, MapPin } from 'lucide-react'

export interface NominatimPlace {
  name: string
  lat: number
  lng: number
  /** [south, north, west, east] in decimal degrees */
  bbox: [number, number, number, number]
}

const NATURE_OPTIONS = [
  { value: 'bird-watching',     label: 'Bird Watching' },
  { value: 'waterfalls-nearby', label: 'Waterfalls Nearby' },
  { value: 'forest-stay',       label: 'Forest Stay' },
  { value: 'river-side',        label: 'River Side' },
  { value: 'beach-side',        label: 'Beach Side' },
  { value: 'mountain-view',     label: 'Mountain View' },
  { value: 'sunrise-point',     label: 'Sunrise Point' },
  { value: 'sunset-point',      label: 'Sunset Point' },
  { value: 'farm-stay',         label: 'Farm Stay' },
  { value: 'mango-orchard',     label: 'Mango Orchard' },
  { value: 'cashew-farm',       label: 'Cashew Farm' },
  { value: 'fishing-village',   label: 'Fishing Village Experience' },
]

const CULTURE_OPTIONS = [
  { value: 'konkani-food',       label: 'Konkani Food' },
  { value: 'malvani-food',       label: 'Malvani Food' },
  { value: 'local-festivals',    label: 'Local Festivals' },
  { value: 'folk-culture',       label: 'Folk Culture' },
  { value: 'traditional-house',  label: 'Traditional House' },
  { value: 'village-lifestyle',  label: 'Village Lifestyle' },
  { value: 'farming-activities', label: 'Farming Activities' },
  { value: 'temple-trails',      label: 'Temple Trails' },
]

const STYLE_OPTIONS = [
  { value: 'solo-friendly',        label: 'Solo Friendly' },
  { value: 'solo-female-friendly', label: 'Solo Female Friendly' },
  { value: 'family-friendly',      label: 'Family Friendly' },
  { value: 'rider-friendly',       label: 'Rider Friendly' },
  { value: 'backpacker-friendly',  label: 'Backpacker Friendly' },
  { value: 'group-stay',           label: 'Group Stay' },
  { value: 'couple-friendly',      label: 'Couple Friendly' },
]

interface Props {
  selectedPlace: NominatimPlace | null
  selectedCategories: string[]
  verifiedOnly: boolean
  onPlaceSelect: (place: NominatimPlace | null) => void
  onCategoryChange: (v: string[]) => void
  onVerifiedChange: (v: boolean) => void
  resultCount: number
  onClear: () => void
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
}

// ── Location picker with Nominatim autocomplete ──────────────────
function LocationPicker({
  selectedPlace,
  onPlaceSelect,
}: {
  selectedPlace: NominatimPlace | null
  onPlaceSelect: (p: NominatimPlace | null) => void
}) {
  const [query, setQuery] = useState(selectedPlace?.name ?? '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync when selectedPlace is cleared externally
  useEffect(() => {
    if (!selectedPlace) setQuery('')
  }, [selectedPlace])

  // Debounced Nominatim search
  useEffect(() => {
    const q = query.trim()
    if (!q || q === selectedPlace?.name) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        setSuggestions(data)
        calcPos()
      } catch {}
      setLoading(false)
    }, 380)
    return () => clearTimeout(timer)
  }, [query, selectedPlace?.name])

  function calcPos() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 280) })
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (inputRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return
      setSuggestions([])
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!suggestions.length) return
    const update = () => calcPos()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [suggestions.length])

  function handleSelect(result: any) {
    const bb = result.boundingbox.map(Number) as [number, number, number, number]
    const place: NominatimPlace = {
      name: result.display_name.split(',')[0].trim(),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      bbox: bb,
    }
    onPlaceSelect(place)
    setQuery(place.name)
    setSuggestions([])
  }

  function handleClear() {
    setQuery('')
    setSuggestions([])
    onPlaceSelect(null)
  }

  const open = suggestions.length > 0

  return (
    <div className="flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-3 py-1.5 focus-within:bg-white/25 focus-within:border-white/60 transition-all">
      <Search size={13} className="text-white/70 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search region or village…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!e.target.value) handleClear()
          calcPos()
        }}
        className="bg-transparent text-white placeholder-white/50 text-sm outline-none w-40 sm:w-52"
      />
      {loading && (
        <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin shrink-0" />
      )}
      {!loading && (query || selectedPlace) && (
        <button onClick={handleClear} className="text-white/60 hover:text-white shrink-0">
          <X size={12} />
        </button>
      )}

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999, minWidth: pos.width }}
          className="bg-white border border-stone-200 rounded-2xl shadow-2xl py-1.5 overflow-hidden"
        >
          <div className="px-4 py-1.5 border-b border-stone-100">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Suggestions</span>
          </div>
          {suggestions.map((r) => {
            const mainName = r.display_name.split(',')[0].trim()
            const context = r.display_name.split(',').slice(1, 3).join(',').trim()
            return (
              <button
                key={r.place_id}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-brand-50 transition-colors flex items-start gap-2.5"
              >
                <MapPin size={14} className="text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-stone-800">{mainName}</div>
                  {context && <div className="text-xs text-stone-400 mt-0.5">{context}</div>}
                </div>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Category multi-select dropdown ───────────────────────────────
function Dropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  label: string
  icon: React.ElementType
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeCount = options.filter((o) => selected.includes(o.value)).length
  const isActive = activeCount > 0

  function calcPos() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    const update = () => calcPos()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => { calcPos(); setOpen((o) => !o) }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap shadow-sm
          ${isActive
            ? 'bg-white text-brand-700 border-white font-semibold'
            : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
          }`}
      >
        <Icon size={14} />
        {isActive ? `${label} (${activeCount})` : label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
          className="w-60 bg-white border border-stone-200 rounded-2xl shadow-2xl py-2 overflow-hidden"
        >
          <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{label}</span>
            {activeCount > 0 && (
              <button
                onClick={() => onChange(selected.filter((s) => !options.some((o) => o.value === s)))}
                className="text-xs text-brand-600 hover:text-brand-800"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-brand-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => onChange(toggle(selected, opt.value))}
                  className="w-4 h-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-stone-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Main filter bar ──────────────────────────────────────────────
export default function FilterBar({
  selectedPlace,
  selectedCategories,
  verifiedOnly,
  onPlaceSelect,
  onCategoryChange,
  onVerifiedChange,
  resultCount,
  onClear,
}: Props) {
  const hasFilters = selectedPlace !== null || selectedCategories.length > 0 || verifiedOnly

  return (
    <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-4 py-3 shadow-md" style={{ position: 'relative', zIndex: 100 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-white/80 text-xs font-semibold uppercase tracking-wider mr-1 hidden sm:block">
          Filter
        </span>

        <LocationPicker selectedPlace={selectedPlace} onPlaceSelect={onPlaceSelect} />

        <Dropdown label="Nature & Adventure" icon={Leaf}    options={NATURE_OPTIONS}  selected={selectedCategories} onChange={onCategoryChange} />
        <Dropdown label="Cultural Experience" icon={Compass} options={CULTURE_OPTIONS} selected={selectedCategories} onChange={onCategoryChange} />
        <Dropdown label="Travel Style"        icon={Users}   options={STYLE_OPTIONS}   selected={selectedCategories} onChange={onCategoryChange} />

        <button
          onClick={() => onVerifiedChange(!verifiedOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all shadow-sm whitespace-nowrap
            ${verifiedOnly
              ? 'bg-white text-brand-700 border-white font-semibold'
              : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
            }`}
        >
          <ShieldCheck size={14} />
          Verified Only
        </button>

        <span className="text-white/70 text-sm ml-1">
          {resultCount} {resultCount === 1 ? 'stay' : 'stays'}
        </span>

        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-white/80 hover:text-white ml-auto transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
