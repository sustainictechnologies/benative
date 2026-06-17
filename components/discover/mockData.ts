import type { TravelIntent, Landscape } from './types'

export const TRAVEL_INTENTS: TravelIntent[] = [
  { id: '1', name: 'Nature & Habitats',   slug: 'nature_habitat',    description: 'Bird watchers, naturalists, wildlife enthusiasts staying close to untouched ecosystems' },
  { id: '2', name: 'Rural Immersion',     slug: 'rural_immersion',   description: 'Village hospitality, local kitchens, farming life, and rural culture' },
  { id: '3', name: 'Long-Stay Retreats',  slug: 'long_stay_retreat',  description: 'Remote workers, students, slow travelers settling in for an extended period' },
  { id: '4', name: 'On-the-Move Transit', slug: 'transit_pitstop',   description: 'Solo riders, drivers, highway travelers needing a safe overnight stop on an active route' },
]

export const LANDSCAPES: Landscape[] = [
  { id: '1', name: 'Forest Borders',           slug: 'env_forest_border',   description: 'Edge of reserve forests, wildlife sanctuaries, or national park buffer zones' },
  { id: '2', name: 'Riverside & Backwaters',   slug: 'env_riverside',       description: 'Clean streams, rivers, village backwaters, or natural water channels' },
  { id: '3', name: 'Untouched Coastal',        slug: 'env_coastal',         description: 'Traditional fishing villages or quiet, non-commercial beaches' },
  { id: '4', name: 'Mountain Passes',          slug: 'env_mountain_valley', description: 'High-altitude ridges, mountain passes, isolated valleys, or misty ghat routes' },
  { id: '5', name: 'Active Farm Belts',        slug: 'env_agricultural',    description: 'Working farms, paddy fields, spice plantations, orchards, or vegetable fields' },
  { id: '6', name: 'Rocky Plateaus',          slug: 'env_rocky_plateau',   description: 'Open stone plateaus, rugged canyons, dry landscapes, or rocky terrain' },
  { id: '7', name: 'Sacred Groves',           slug: 'env_sacred_grove',    description: 'Community-guarded woods, old orchards, bamboo thickets, or native vegetation' },
  { id: '8', name: 'Wetland Fringes',         slug: 'env_wetland',         description: 'Village lakes, natural reservoirs, seasonal wetlands, or waterbird habitats' },
]
