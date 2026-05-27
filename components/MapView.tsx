'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import type { HomestayWithCategories } from '@/types/blocks.types'
import type { NominatimPlace } from './FilterSidebar'
import { ShieldCheck } from 'lucide-react'

export interface MapBounds {
  south: number
  north: number
  west: number
  east: number
}

const dotIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;
    background:#1e6b1e;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.25)
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const INDIA_CENTER: [number, number] = [22.5, 80.5]
const DEFAULT_ZOOM = 5

interface Props {
  homestays: HomestayWithCategories[]
  selectedPlace?: NominatimPlace | null
  onBoundsChange?: (bounds: MapBounds) => void
}

function MapController({ selectedPlace }: { selectedPlace: NominatimPlace | null }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedPlace) {
      map.setView(INDIA_CENTER, DEFAULT_ZOOM, { animate: true })
      return
    }
    const { bbox } = selectedPlace
    const bounds = L.latLngBounds([[bbox[0], bbox[2]], [bbox[1], bbox[3]]])
    map.fitBounds(bounds, { padding: [48, 48], animate: true })
  }, [selectedPlace, map])

  return null
}

function BoundsTracker({ onBoundsChange }: { onBoundsChange: (b: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds()
      onBoundsChange({ south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() })
    },
    zoomend: () => {
      const b = map.getBounds()
      onBoundsChange({ south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() })
    },
  })
  return null
}

export default function MapView({ homestays, selectedPlace = null, onBoundsChange }: Props) {
  const highlightBounds = selectedPlace
    ? ([[selectedPlace.bbox[0], selectedPlace.bbox[2]], [selectedPlace.bbox[1], selectedPlace.bbox[3]]] as [[number, number], [number, number]])
    : null

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedPlace={selectedPlace} />
      {onBoundsChange && <BoundsTracker onBoundsChange={onBoundsChange} />}

      {highlightBounds && (
        <Rectangle
          bounds={highlightBounds}
          pathOptions={{
            color: '#1e6b1e',
            weight: 2,
            fillColor: '#1e6b1e',
            fillOpacity: 0.08,
            dashArray: '6 4',
          }}
        />
      )}

      {homestays.map((h) => (
        <Marker key={h.id} position={[h.latitude, h.longitude]} icon={dotIcon}>
          <Popup className="jalad-popup">
            <div className="min-w-[180px]">
              <div className="flex items-start gap-1.5 mb-1">
                <span className="font-semibold text-sm text-stone-900 leading-tight">{h.title}</span>
                {h.is_verified && (
                  <ShieldCheck size={13} className="text-brand-600 shrink-0 mt-0.5" />
                )}
              </div>
              <p className="text-xs text-stone-500 mb-2">
                {h.village_name}, {h.location_district}
              </p>
              <Link
                href={`/homestays/${h.slug}`}
                className="inline-block text-xs font-medium text-brand-600 hover:text-brand-800"
              >
                View details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
