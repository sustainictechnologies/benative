'use client'

// @ts-ignore
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, GeoJSON, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import type { Polygon, MultiPolygon } from 'geojson'
import type { HomestayWithCategories } from '@/types/blocks.types'

const INDIA_CENTER: [number, number] = [20.5, 78.5]
const DEFAULT_ZOOM = 5

// Where a search wants the map to look: a searched place (with its border, or a circle
// for small places) or the stays a search found
export interface MapFocus {
  key:      string                                   // the map moves again only when this changes
  bounds:   [[number, number], [number, number]]     // [[south, west], [north, east]]
  outline?: Polygon | MultiPolygon | null
  circle?:  { center: [number, number]; radiusKm: number }
}

const AREA_STYLE = { color: '#1e6b1e', weight: 2, fillColor: '#2d7d2d', fillOpacity: 0.08 }

function FocusController({ focus }: { focus: MapFocus | null }) {
  const map      = useMap()
  const latest   = useRef(focus)
  const hadFocus = useRef(false)
  latest.current = focus
  const key = focus?.key ?? null

  useEffect(() => {
    const f = latest.current
    if (f) {
      map.fitBounds(f.bounds, { padding: [28, 28], maxZoom: 11 })
      hadFocus.current = true
    } else if (hadFocus.current) {
      // The search was cleared: back to all of India
      map.setView(INDIA_CENTER, DEFAULT_ZOOM)
      hadFocus.current = false
    }
  }, [key, map])

  return null
}

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
  focus?: MapFocus | null
}

export default function DiscoverMap({ homestays, highlightedId, onMarkerClick, onBoundsChange, focus = null }: Props) {
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

      <FocusController focus={focus} />
      {focus?.outline && (
        <GeoJSON key={focus.key} data={focus.outline} style={AREA_STYLE} interactive={false} />
      )}
      {focus?.circle && (
        <Circle
          key={focus.key}
          center={focus.circle.center}
          radius={focus.circle.radiusKm * 1000}
          pathOptions={AREA_STYLE}
          interactive={false}
        />
      )}

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
