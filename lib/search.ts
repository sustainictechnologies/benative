// Homestay search, shared by the homepage search box and the Discover page.
// The matching itself happens in the database (supabase/search_homestays.sql):
// name, village, district, sub-categories and facilities, allowing small spelling mistakes.

import type { SupabaseClient } from '@supabase/supabase-js'
import { SUB_CATEGORY_GROUPS } from '@/lib/subCategories'

export const MIN_SEARCH_LENGTH = 2

export interface SearchHit {
  id:                string
  title:             string
  slug:              string
  village_name:      string
  location_district: string
  latitude:          number
  longitude:         number
  cover_image_url:   string | null
  sub_categories:    string[]
  facilities:        string[]
  title_score:       number
  place_score:       number
  score:             number
}

export async function searchHomestays(supabase: SupabaseClient, q: string): Promise<SearchHit[]> {
  const term = q.trim()
  if (term.length < MIN_SEARCH_LENGTH) return []
  const { data, error } = await supabase.rpc('search_homestays', { q: term })
  if (error) {
    console.error('[search] failed:', error.message)
    return []
  }
  return (data ?? []) as SearchHit[]
}

// Scores of 0.6 and above count as a match (the same line the database uses)
const MATCH = 0.6

const SUB_LABELS = new Map(
  SUB_CATEGORY_GROUPS.flatMap(group => group.subCategories.map(sub => [sub.key, sub.label] as [string, string])),
)

const normalise = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ऀ-ॿ\s]/g, ' ').replace(/\s+/g, ' ').trim()

function editDistance(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

// Whether a place or category name fits what was typed, allowing a slip or two in longer words
export function nameMatches(q: string, name: string) {
  const query = normalise(q)
  const text  = normalise(name)
  if (!query || !text) return false
  if (text.includes(query)) return true
  const words = text.split(' ')
  return query.split(' ').every(part => {
    const allowed = part.length >= 7 ? 2 : part.length >= 4 ? 1 : 0
    return words.some(w => w.startsWith(part) ||
      (allowed > 0 && (editDistance(part, w) <= allowed || editDistance(part, w.slice(0, part.length)) <= allowed)))
  })
}

export interface Suggestions {
  stays:  SearchHit[]
  places: { name: string; within: string | null; count: number }[]
  kinds:  { name: string; kind: 'category' | 'facility'; count: number }[]
}

// Turns search results into the three groups shown under the search box
export function groupSuggestions(q: string, hits: SearchHit[]): Suggestions {
  const stays = hits
    .filter(h => h.title_score >= MATCH)
    .sort((a, b) => b.title_score - a.title_score)
    .slice(0, 4)

  const places = new Map<string, { name: string; within: string | null; ids: Set<string> }>()
  for (const h of hits.filter(h => h.place_score >= MATCH)) {
    for (const [name, within] of [[h.village_name, h.location_district], [h.location_district, null]] as const) {
      if (!name || !nameMatches(q, name)) continue
      const key = normalise(name)
      const entry = places.get(key) ?? { name, within, ids: new Set<string>() }
      entry.ids.add(h.id)
      places.set(key, entry)
    }
  }

  const kinds = new Map<string, { name: string; kind: 'category' | 'facility'; ids: Set<string> }>()
  for (const h of hits) {
    const names: [string, 'category' | 'facility'][] = [
      ...h.sub_categories.map(key => [SUB_LABELS.get(key) ?? '', 'category'] as [string, 'category']),
      ...h.facilities.map(name => [name, 'facility'] as [string, 'facility']),
    ]
    for (const [name, kind] of names) {
      if (!name || !nameMatches(q, name)) continue
      const entry = kinds.get(name) ?? { name, kind, ids: new Set<string>() }
      entry.ids.add(h.id)
      kinds.set(name, entry)
    }
  }

  return {
    stays,
    places: Array.from(places.values())
      .map(p => ({ name: p.name, within: p.within, count: p.ids.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    kinds: Array.from(kinds.values())
      .map(k => ({ name: k.name, kind: k.kind, count: k.ids.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
  }
}
