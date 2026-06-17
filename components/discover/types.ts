export interface TravelIntent {
  id: string
  name: string
  slug: string
  description: string
}

export interface Landscape {
  id: string
  name: string
  slug: string
  description: string
}

export interface PracticalFilters {
  verifiedOnly: boolean
  languages: string[]
  practicalSlugs: string[]
}

export const EMPTY_PRACTICAL_FILTERS: PracticalFilters = {
  verifiedOnly: false,
  languages: [],
  practicalSlugs: [],
}
