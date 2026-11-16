// Shared by the Discover page (on the server and in the browser) and the homepage's "Stays to discover" row
import type { HomestayWithCategories } from '@/types/blocks.types'

// All of India: what Discover lists before the map or a search narrows it
export const INDIA = { south: 8.0, north: 37.5, west: 68.0, east: 97.5 }

// A homestay row (from discover_homestays, or the homestays table) as a card
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDiscoverCard(h: any): HomestayWithCategories {
  return {
    id:                h.id,
    title:             h.title,
    slug:              h.slug,
    location_district: h.location_district,
    village_name:      h.village_name,
    host_name:         h.host_name,
    is_verified:       h.is_verified,
    latitude:          h.latitude,
    longitude:         h.longitude,
    calling_window:    h.calling_window,
    languages_spoken:  h.languages_spoken ?? [],
    categories:        [],
    cover_image_url:   h.cover_image_url ?? null,
  }
}
