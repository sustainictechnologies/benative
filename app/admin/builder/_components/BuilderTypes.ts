export type BlockType =
  | 'hero'
  | 'host-story'
  | 'activity-log'
  | 'rules-block'
  | 'how-to-reach'
  | 'video'
  | 'gallery'

  | 'rooms'
  | 'reviews'
  | 'food'
  | 'whatsapp'
  | 'map'
  | 'contact'
  | 'google-rating'

export interface BlockProps {
  bgColor?: string
  textColor?: string
  accentColor?: string
  paddingY?: number
  headingSize?: number
  imageUrl?: string
  borderRadius?: number
  showShadow?: boolean
  fontFamily?: string
  /** Keyed image overrides: imageKey → url */
  images?: Record<string, string>
  /** Keyed text overrides: textKey → value */
  texts?: Record<string, string>
}

export interface CanvasBlock {
  id:      string
  type:    BlockType
  props:   BlockProps
  hidden?: boolean
}

export const DEFAULT_PROPS: BlockProps = {
  bgColor: '#ffffff',
  textColor: '#1c1c1c',
  accentColor: '#1e6b1e',
  paddingY: 60,
  headingSize: 32,
  borderRadius: 0,
  showShadow: false,
  fontFamily: 'Inter',
}

export const PALETTE = [
  { type: 'hero'        as BlockType, label: 'Hero Block',      emoji: '🌄', desc: 'Cover photo + tagline',      group: 'Core' },
  { type: 'contact'     as BlockType, label: 'Contact Card',    emoji: '📞', desc: 'Auth-gated host contact',    group: 'Core' },
  { type: 'host-story'  as BlockType, label: 'Host Story',       emoji: '🙏', desc: 'Host photo & personal story', group: 'Core' },
  { type: 'activity-log' as BlockType, label: 'Activity Log',     emoji: '🧭', desc: 'Activities & experiences', group: 'Core' },
  { type: 'rules-block'   as BlockType, label: 'House Rules',      emoji: '📋', desc: 'Policies & prohibited items', group: 'Core' },
  { type: 'how-to-reach' as BlockType, label: 'How to Reach',     emoji: '🗺️', desc: 'Directions by road/train/air',  group: 'Core' },
  { type: 'video'       as BlockType, label: 'Video',            emoji: '🎥', desc: 'YouTube embed + caption', group: 'Core' },
  { type: 'gallery'     as BlockType, label: 'Gallery',          emoji: '🖼️', desc: 'Photo grid showcase', group: 'Extra' },

  { type: 'rooms'       as BlockType, label: 'Rooms',            emoji: '🛏️', desc: 'Room types & pricing', group: 'Extra' },
  { type: 'reviews'     as BlockType, label: 'Reviews',          emoji: '⭐', desc: 'Guest testimonials', group: 'Extra' },
  { type: 'food'        as BlockType, label: 'Food Section',     emoji: '🍛', desc: 'Home cooking & meals', group: 'Extra' },
  { type: 'whatsapp'    as BlockType, label: 'WhatsApp CTA',     emoji: '💬', desc: 'Direct message button', group: 'Extra' },
  { type: 'map'           as BlockType, label: 'Map & Location',   emoji: '📍', desc: 'Interactive location',         group: 'Extra' },
  { type: 'google-rating' as BlockType, label: 'Google Rating',    emoji: '⭐', desc: 'Google rating & review count', group: 'Extra' },
]
