'use client'

// @ts-ignore
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
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


function BoundsReporter({ onBoundsChange }: { onBoundsChange: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
    load:    () => onBoundsChange(map.getBounds()),
  })

  useEffect(() => {
    onBoundsChange(map.getBounds())
  }, [map, onBoundsChange])

  return null
}

interface Props {
  homestays: HomestayWithCategories[]
  highlightedId?: string | null
  onMarkerClick?: (id: string) => void
  onBoundsChange?: (bounds: L.LatLngBounds) => void
}

export default function DiscoverMap({ homestays, highlightedId, onMarkerClick, onBoundsChange }: Props) {
  const valid = useMemo(
    () => homestays.filter((h) => h.latitude != null && h.longitude != null),
    [homestays]
  )

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

      {onBoundsChange && <BoundsReporter onBoundsChange={onBoundsChange} />}

      {valid.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={makeDotIcon(highlightedId === h.id)}
          eventHandlers={{ click: () => onMarkerClick?.(h.id) }}
        />
      ))}
    </MapContainer>
  )
}
