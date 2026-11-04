// Place search for the Discover map: finds a town, district, state or region in India
// with OpenStreetMap's place search (Nominatim), so the map can zoom to it, outline it
// and show the homestays inside it.
//
// Nominatim is free with a fair-use limit of about one search per second; the map
// already credits OpenStreetMap. A place looked up once is remembered for the visit.

import type { Geometry, Polygon, MultiPolygon, Position } from 'geojson'
import { nameMatches } from '@/lib/search'

export interface Place {
  name:     string
  label:    string                        // e.g. "Sindhudurg, Maharashtra"
  lat:      number
  lng:      number
  bbox:     [number, number, number, number]   // south, north, west, east
  outline:  Polygon | MultiPolygon | null       // the border, when OpenStreetMap has one
  radiusKm: number                              // used instead of a border for small places
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const WAIT_MS   = 3000

// Small places often have no border in OpenStreetMap: a circle of this size stands in for it
const RADIUS_KM: Record<string, number> = {
  hamlet: 6, isolated_dwelling: 6, locality: 8, village: 8, neighbourhood: 6, suburb: 8,
  town: 12, municipality: 15, city: 20,
}

const remembered = new Map<string, Place | null>()

interface NominatimResult {
  name:        string
  lat:         string
  lon:         string
  category:    string
  type:        string
  addresstype: string
  place_rank:  number      // smaller = larger area (state 8, district 12, city 16, village 19…)
  boundingbox: [string, string, string, string]
  address?:    { state?: string }
  geojson?:    Geometry
}

export async function findPlace(q: string): Promise<Place | null> {
  const term = q.trim()
  if (term.length < 3) return null
  const key = term.toLowerCase()
  if (remembered.has(key)) return remembered.get(key) ?? null

  const params = new URLSearchParams({
    q: term, format: 'jsonv2', countrycodes: 'in', limit: '5', addressdetails: '1',
    'accept-language': 'en', polygon_geojson: '1', polygon_threshold: '0.01',
  })
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), WAIT_MS)
  try {
    const res = await fetch(`${NOMINATIM}?${params}`, { signal: stop.signal })
    if (!res.ok) return null
    const results = (await res.json()) as NominatimResult[]

    // A real place (not a road or a shop) whose name is what was typed. When a name is both
    // a city and its district (Kolhapur), the larger area is used.
    const hit = results
      .filter(r =>
        (r.category === 'place' || (r.category === 'boundary' && r.type === 'administrative')) &&
        nameMatches(term, r.name))
      .sort((a, b) => a.place_rank - b.place_rank)[0]
    const place: Place | null = hit ? {
      name:     hit.name,
      label:    hit.address?.state && hit.address.state !== hit.name ? `${hit.name}, ${hit.address.state}` : hit.name,
      lat:      Number(hit.lat),
      lng:      Number(hit.lon),
      bbox:     hit.boundingbox.map(Number) as Place['bbox'],
      outline:  hit.geojson && (hit.geojson.type === 'Polygon' || hit.geojson.type === 'MultiPolygon') ? hit.geojson : null,
      radiusKm: RADIUS_KM[hit.addresstype] ?? 15,
    } : null
    remembered.set(key, place)
    return place
  } catch {
    return null   // slow or unreachable: the search works without the map outline
  } finally {
    clearTimeout(timer)
  }
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

// Ray casting on one ring of [lng, lat] points
function inRing(lng: number, lat: number, ring: Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const inPolygon = (lng: number, lat: number, rings: Position[][]) =>
  inRing(lng, lat, rings[0]) && !rings.slice(1).some(hole => inRing(lng, lat, hole))

export function insidePlace(place: Place, lat: number, lng: number) {
  if (place.outline?.type === 'Polygon') return inPolygon(lng, lat, place.outline.coordinates)
  if (place.outline?.type === 'MultiPolygon') return place.outline.coordinates.some(p => inPolygon(lng, lat, p))
  return distanceKm(place.lat, place.lng, lat, lng) <= place.radiusKm
}
