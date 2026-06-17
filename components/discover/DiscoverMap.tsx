'use client'

// @ts-ignore
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { useEffect } from 'react'
import type { HomestayWithCategories } from '@/types/blocks.types'

const INDIA_CENTER: [number, number] = [20.5, 78.5]
const DEFAULT_ZOOM = 5

function makeDotIcon(highlighted: boolean) {
  const size = highlighted ? 18 : 14
  const color = highlighted ? '#154315' : '#1e6b1e'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:2.5px solid white;
      box-shadow:0 1px 6px rgba(0,0,0,0.28);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Flies to bounds whenever the filtered homestay list changes
function BoundsFitter({ homestays }: { homestays: HomestayWithCategories[] }) {
  const map = useMap()

  useEffect(() => {
    if (homestays.length === 0) return
    if (homestays.length === 1) {
      map.flyTo([homestays[0].latitude, homestays[0].longitude], 12, { duration: 0.8 })
      return
    }
    const bounds = L.latLngBounds(homestays.map((h) => [h.latitude, h.longitude]))
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 13, duration: 0.8 })
  }, [homestays, map])

  return null
}

interface Props {
  homestays: HomestayWithCategories[]
  highlightedId?: string | null
  onMarkerClick?: (id: string) => void
}

export default function DiscoverMap({ homestays, highlightedId, onMarkerClick }: Props) {
  const valid = homestays.filter((h) => h.latitude != null && h.longitude != null)

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" tabIndex={-1}>OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsFitter homestays={valid} />

      {valid.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={makeDotIcon(highlightedId === h.id)}
          eventHandlers={{ click: () => onMarkerClick?.(h.id) }}
        >
          <Popup maxWidth={200}>
            <div className="min-w-[160px] py-1">
              <p className="font-semibold text-sm text-stone-900 leading-tight">{h.title}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {h.village_name}, {h.location_district}
              </p>
              {h.categories.length > 0 && (
                <p className="text-[11px] text-stone-400 mt-1">
                  {h.categories.slice(0, 2).map((c) => c.name).join(' · ')}
                </p>
              )}
              <Link
                href={`/homestays/${h.slug}`}
                className="inline-block mt-2 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
              >
                View homestay →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
