'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { X, MapPin, Loader2 } from 'lucide-react'

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-stone-100">
      <Loader2 size={20} className="animate-spin text-stone-400" />
    </div>
  ),
})

export interface MapLocation { lat: number; lng: number }

interface Props {
  open:     boolean
  location: MapLocation | null
  onClose:  () => void
  onSave:   (location: MapLocation | null) => void
}

// The homestay's place on the map, set while building the page. It is saved with the draft, so a
// preview can come with its Launch button and the Publish dialog starts from it.
export default function MapLocationModal({ open, location, onClose, onSave }: Props) {
  const [lat, setLat]           = useState<number | null>(null)
  const [lng, setLng]           = useState<number | null>(null)
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [coordErr, setCoordErr] = useState('')

  useEffect(() => {
    if (!open) return
    setLat(location?.lat ?? null)
    setLng(location?.lng ?? null)
    setLatInput(location ? String(location.lat) : '')
    setLngInput(location ? String(location.lng) : '')
    setCoordErr('')
  }, [open, location])

  if (!open) return null

  const pick = (la: number, lo: number) => {
    setLat(la); setLng(lo)
    setLatInput(la.toFixed(6)); setLngInput(lo.toFixed(6))
    setCoordErr('')
  }

  const useCoords = () => {
    const la = parseFloat(latInput)
    const lo = parseFloat(lngInput)
    if (isNaN(la) || la < -90  || la > 90)  { setCoordErr('Latitude must be between -90 and 90');    return }
    if (isNaN(lo) || lo < -180 || lo > 180) { setCoordErr('Longitude must be between -180 and 180'); return }
    setLat(la); setLng(lo); setCoordErr('')
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="font-bold text-white">Map Location</p>
            <p className="text-brand-200 text-xs mt-0.5">Where the homestay is: needed before the host can launch it</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="relative shrink-0" style={{ height: 260 }}>
          <LocationPickerMap lat={lat} lng={lng} onPick={pick} />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-[11px] text-stone-500 px-3 py-1 rounded-full shadow pointer-events-none z-[999]">
            {lat !== null ? 'Click to move the pin' : 'Click to drop a pin'}
          </div>
        </div>

        <div className="px-5 pt-4 space-y-2 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Or enter latitude &amp; longitude</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={latInput}
              onChange={e => { setLatInput(e.target.value); setCoordErr('') }}
              placeholder="Latitude, e.g. 16.7050"
              step="any"
              className="flex-1 min-w-0 text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300 font-mono"
            />
            <input
              type="number"
              value={lngInput}
              onChange={e => { setLngInput(e.target.value); setCoordErr('') }}
              placeholder="Longitude, e.g. 74.2433"
              step="any"
              className="flex-1 min-w-0 text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300 font-mono"
            />
            <button
              onClick={useCoords}
              className="shrink-0 px-3 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold rounded-xl transition-colors"
            >
              Show
            </button>
          </div>
          {coordErr && <p className="text-xs text-rose-500">{coordErr}</p>}
          <p className="text-[10px] text-stone-400">In Google Maps, right-click the homestay and click the numbers to copy them.</p>
        </div>

        <div className="px-5 py-4 mt-3 border-t border-stone-100 flex items-center gap-3 shrink-0">
          {location && (
            <button onClick={() => onSave(null)} className="text-xs text-stone-400 hover:text-rose-500 transition-colors">
              Remove location
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 text-sm text-stone-500 hover:text-stone-700">
            Cancel
          </button>
          <button
            onClick={() => { if (lat !== null && lng !== null) onSave({ lat, lng }) }}
            disabled={lat === null || lng === null}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <MapPin size={14} /> Use this location
          </button>
        </div>
      </div>
    </div>
  )
}
