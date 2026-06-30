'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { X, MapPin, Navigation, Check, Loader2, User, Phone, Mail, Home, Globe, Pencil } from 'lucide-react'
import { publishHomestay, type PublishPayload } from '@/lib/actions/publishLocation'
import { createClient } from '@/lib/supabase/client'
import type { CanvasBlock } from './BuilderTypes'

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-stone-100">
      <Loader2 size={20} className="animate-spin text-stone-400" />
    </div>
  ),
})

type Mode   = 'map' | 'gps' | 'coords'
type Status = 'idle' | 'locating' | 'saving' | 'done' | 'error'

interface BuilderData {
  title:     string
  hostName:  string
  phone:     string
  whatsapp:  string
  email:     string
  address:   string
  languages: string[]
  blocks:    CanvasBlock[]
}

interface Props {
  open:        boolean
  onClose:     () => void
  builderData: BuilderData
}

const FIELD_ROWS = [
  { icon: Home,   key: 'title' as const,    label: 'Homestay name' },
  { icon: User,   key: 'hostName' as const,  label: 'Host name'     },
  { icon: Phone,  key: 'phone' as const,     label: 'Phone'         },
  { icon: Phone,  key: 'whatsapp' as const,  label: 'WhatsApp'      },
  { icon: Mail,   key: 'email' as const,     label: 'Email'         },
  { icon: MapPin, key: 'address' as const,   label: 'Address'       },
]

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function PublishModal({ open, onClose, builderData }: Props) {
  const [mode, setMode]     = useState<Mode>('map')
  const [lat, setLat]       = useState<number | null>(null)
  const [lng, setLng]       = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [coordErr, setCoordErr] = useState('')

  const slug = useMemo(() => toSlug(builderData.title), [builderData.title])

  // Load existing location from Supabase when modal opens
  useEffect(() => {
    if (!open || !slug) return
    const supabase = createClient()
    supabase
      .from('homestays')
      .select('latitude, longitude')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data?.latitude != null && data?.longitude != null) {
          setLat(data.latitude)
          setLng(data.longitude)
        }
      })
  }, [open, slug])

  const useGPS = useCallback(() => {
    if (!navigator.geolocation) { setErrMsg('Geolocation not supported'); return }
    setStatus('locating')
    setErrMsg('')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setStatus('idle') },
      err => {
        setStatus('idle')
        if (err.code === 1)
          setErrMsg('Location access denied. Click the 🔒 icon in your address bar → allow Location → try again.')
        else if (err.code === 2)
          setErrMsg('Location unavailable. Pick on map instead.')
        else
          setErrMsg('Timed out. Try again or pick on the map.')
      },
      { timeout: 12000, enableHighAccuracy: true }
    )
  }, [])

  const publish = useCallback(async () => {
    if (lat === null || lng === null) { setErrMsg('Pick a location on the map first'); return }
    setStatus('saving')
    setErrMsg('')

    const payload: PublishPayload = {
      slug:      slug.trim(),
      title:     builderData.title,
      hostName:  builderData.hostName,
      phone:     builderData.phone,
      whatsapp:  builderData.whatsapp,
      email:     builderData.email,
      address:   builderData.address,
      languages: builderData.languages,
      blocks:    builderData.blocks,
      latitude:  lat,
      longitude: lng,
    }

    const result = await publishHomestay(payload)
    if (!result.success) { setErrMsg(result.error ?? 'Publish failed'); setStatus('error') }
    else                  { setStatus('done') }
  }, [lat, lng, slug, builderData])

  const reset = () => { setLat(null); setLng(null); setStatus('idle'); setErrMsg(''); setMode('map'); setLatInput(''); setLngInput(''); setCoordErr('') }

  if (!slug) return null  // no title set yet

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) { reset(); onClose() } }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="font-bold text-white">Publish Homestay</p>
            <p className="text-brand-200 text-xs mt-0.5">Review details, pick location, then publish</p>
          </div>
          <button onClick={() => { reset(); onClose() }} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {status === 'done' ? (
          /* ── Success ── */
          <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-lg">Published!</p>
              <p className="text-sm text-stone-500 mt-1">
                All details saved · Location at {lat?.toFixed(5)}, {lng?.toFixed(5)}<br />
                Your homestay is now live on the Map and Explore pages.
              </p>
            </div>
            <button
              onClick={() => { reset(); onClose() }}
              className="mt-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 flex flex-col">

            {/* Data preview */}
            <div className="px-5 pt-4 pb-3 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Data to be saved</p>
              <div className="rounded-xl border border-stone-100 divide-y divide-stone-100">
                {FIELD_ROWS.map(({ icon: Icon, key, label }) => (
                  <div key={key} className="flex items-center gap-3 px-3 py-2">
                    <Icon size={13} className="text-stone-400 shrink-0" />
                    <span className="text-[11px] text-stone-400 w-20 shrink-0">{label}</span>
                    <span className="text-xs text-stone-700 truncate">
                      {builderData[key] || <span className="text-stone-300 italic">not set</span>}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3 px-3 py-2">
                  <Globe size={13} className="text-stone-400 shrink-0" />
                  <span className="text-[11px] text-stone-400 w-20 shrink-0">Languages</span>
                  <span className="text-xs text-stone-700">{builderData.languages.join(', ') || <span className="text-stone-300 italic">not set</span>}</span>
                </div>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex border-y border-stone-100 shrink-0">
              {([
                ['map',    '🗺️ Map'],
                ['gps',    '📍 My GPS'],
                ['coords', '📌 Coordinates'],
              ] as const).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m)
                    if (m === 'coords') {
                      setLatInput(lat !== null ? String(lat) : '')
                      setLngInput(lng !== null ? String(lng) : '')
                      setCoordErr('')
                    }
                  }}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    mode === m
                      ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Map */}
            {mode === 'map' && (
              <div className="relative shrink-0" style={{ height: 220 }}>
                <LocationPickerMap lat={lat} lng={lng} onPick={(la, lo) => { setLat(la); setLng(lo) }} />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-[11px] text-stone-500 px-3 py-1 rounded-full shadow pointer-events-none z-[999]">
                  {lat !== null ? 'Previously saved location shown · Click to change' : 'Click to drop a pin'}
                </div>
              </div>
            )}

            {/* GPS */}
            {mode === 'gps' && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
                  <Navigation size={22} className="text-brand-600" />
                </div>
                {lat !== null && lng !== null ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 font-medium">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={useGPS}
                      disabled={status === 'locating'}
                      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-stone-300 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {status === 'locating'
                        ? <><Loader2 size={14} className="animate-spin" /> Detecting…</>
                        : <><Navigation size={14} /> Get My Location</>
                      }
                    </button>
                    {errMsg && <p className="text-xs text-rose-500 max-w-xs leading-relaxed">{errMsg}</p>}
                  </>
                )}
              </div>
            )}

            {/* Coordinates input panel */}
            {mode === 'coords' && (
              <div className="mx-5 my-3 space-y-3 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Enter latitude &amp; longitude
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-stone-400 font-semibold block mb-1">Latitude</label>
                    <input
                      type="number"
                      value={latInput}
                      onChange={e => { setLatInput(e.target.value); setCoordErr('') }}
                      placeholder="e.g. 16.7050"
                      step="any"
                      className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300 font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-stone-400 font-semibold block mb-1">Longitude</label>
                    <input
                      type="number"
                      value={lngInput}
                      onChange={e => { setLngInput(e.target.value); setCoordErr('') }}
                      placeholder="e.g. 74.2433"
                      step="any"
                      className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300 font-mono"
                    />
                  </div>
                </div>
                {coordErr && <p className="text-xs text-rose-500">{coordErr}</p>}
                <button
                  onClick={() => {
                    const la = parseFloat(latInput)
                    const lo = parseFloat(lngInput)
                    if (isNaN(la) || la < -90  || la > 90)  { setCoordErr('Latitude must be between -90 and 90');    return }
                    if (isNaN(lo) || lo < -180 || lo > 180) { setCoordErr('Longitude must be between -180 and 180'); return }
                    setLat(la); setLng(lo)
                    setMode('map')
                  }}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <MapPin size={13} /> Set Location on Map
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  You can copy coordinates from Google Maps — right-click any point and copy the numbers shown.
                </p>
              </div>
            )}

            {/* Coordinates pill */}
            {lat !== null && lng !== null && mode !== 'coords' && (
              <div className="mx-5 mt-2 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-500 shrink-0">
                <MapPin size={11} className="text-brand-600 shrink-0" />
                <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                <button
                  onClick={() => {
                    setLatInput(String(lat)); setLngInput(String(lng)); setCoordErr(''); setMode('coords')
                  }}
                  title="Edit coordinates"
                  className="ml-auto text-stone-300 hover:text-brand-500 transition-colors"
                >
                  <Pencil size={10} />
                </button>
                <button onClick={() => { setLat(null); setLng(null) }} title="Clear" className="text-stone-300 hover:text-rose-500 transition-colors">
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Slug — auto-generated, read only */}
            <div className="px-5 mt-3 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Page URL slug</p>
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                <span className="text-xs text-stone-400 shrink-0">benative.in/stays/</span>
                <span className="text-xs font-mono text-brand-600 font-semibold">{slug}</span>
                <span className="ml-auto text-[10px] text-stone-300 italic">auto-generated</span>
              </div>
            </div>

            {errMsg && mode !== 'gps' && (
              <p className="mx-5 mt-2 text-xs text-rose-500">{errMsg}</p>
            )}

            {/* Footer */}
            <div className="px-5 py-4 mt-3 border-t border-stone-100 flex items-center justify-end gap-3 shrink-0">
              <button onClick={() => { reset(); onClose() }} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700">
                Cancel
              </button>
              <button
                onClick={publish}
                disabled={lat === null || lng === null || status === 'saving'}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
              >
                {status === 'saving'
                  ? <><Loader2 size={14} className="animate-spin" /> Publishing…</>
                  : <><Check size={14} /> Publish</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
