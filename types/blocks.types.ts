export interface HeroBlockData {
  cover_image_url: string
  tagline?: string
}

export interface HostStoryBlockData {
  host_image_url: string
  story_title: string
  story_text: string
}

export interface BirdingLogBlockData {
  highlight_species: string[]
  best_watching_hours: string
  nearby_hotspot_trail: string
}

export interface RulesBlockData {
  safety_status: string
  prohibited_items: string[]
  house_policies: string[]
}

export interface VideoBlockData {
  youtube_video_id: string
  caption?: string
}

export interface AgriCalendarBlockData {
  season_label: string
  crops: string[]
  activities: string[]
}

export type HomestayBlock =
  | { id: string; homestay_id: string; sort_order: number; block_type: 'hero';          content_data: HeroBlockData }
  | { id: string; homestay_id: string; sort_order: number; block_type: 'host-story';    content_data: HostStoryBlockData }
  | { id: string; homestay_id: string; sort_order: number; block_type: 'birding-log';   content_data: BirdingLogBlockData }
  | { id: string; homestay_id: string; sort_order: number; block_type: 'rules-block';   content_data: RulesBlockData }
  | { id: string; homestay_id: string; sort_order: number; block_type: 'video';         content_data: VideoBlockData }
  | { id: string; homestay_id: string; sort_order: number; block_type: 'agri-calendar'; content_data: AgriCalendarBlockData }
  | { id: string; homestay_id: string; sort_order: number; block_type: string;          content_data: Record<string, unknown> }

export interface HomestayWithCategories {
  id: string
  title: string
  slug: string
  location_district: string
  village_name: string
  host_name: string
  is_verified: boolean
  latitude: number
  longitude: number
  calling_window: string
  languages_spoken: string[]
  categories: { id: number; name: string; slug: string }[]
  cover_image_url: string | null
}

export interface ReviewWithProfile {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    full_name: string
  } | null
}