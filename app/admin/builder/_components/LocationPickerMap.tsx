'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import 'leaflet/dist/leaflet.css'

const PIN = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:  [25, 41],
  iconAnchor:[12, 41],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef<string>('')
  const key = `${lat},${lng}`
  useEffect(() => {
    if (key === prevRef.current) return
    prevRef.current = key
    // Use setView with no animation to avoid classList errors
    map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: false })
  }, [lat, lng, map, key])
  return null
}

interface Props {
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number) => void
}

export default function LocationPickerMap({ lat, lng, onPick }: Props) {
  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      className="w-full h-full"
      style={{ cursor: 'crosshair' }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {lat !== null && lng !== null && (
        <>
          <Marker position={[lat, lng]} icon={PIN} />
          <RecenterMap lat={lat} lng={lng} />
        </>
      )}
    </MapContainer>
  )
}
