import Image from 'next/image'
import { Fish, Utensils, Sun, Heart, Leaf, Home, Sprout, Coffee, Wheat, Disc2, Salad, Beef, Drumstick, Egg, ChefHat, Flame, Apple, Soup, Pizza, Sandwich, Carrot, Cherry, Cookie } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface FoodHighlight {
  id:       string
  icon:     string
  label:    string
  sublabel: string
}

interface FoodItem {
  id:        string
  image_url: string | null
  name:      string
  desc:      string
  emoji?:    string
  tags?:     string[]
}

interface Props {
  data: {
    label?:          string
    title?:          string
    description?:    string
    hero_image_url?: string | null
    items?:          FoodItem[]
    highlights?:     FoodHighlight[]
  }
}

const FOOD_ICON_MAP: Record<string, { Icon: LucideIcon; bg: string; color: string; tagBg: string; tagText: string; tagBorder: string }> = {
  fish:      { Icon: Fish,      bg: 'bg-teal-50',    color: 'text-teal-500',    tagBg: '#f0fdfa', tagText: '#0d9488', tagBorder: '#99f6e4' },
  disc2:     { Icon: Disc2,     bg: 'bg-orange-50',  color: 'text-orange-500',  tagBg: '#fff7ed', tagText: '#ea580c', tagBorder: '#fed7aa' },
  utensils:  { Icon: Utensils,  bg: 'bg-orange-50',  color: 'text-orange-500',  tagBg: '#fff7ed', tagText: '#ea580c', tagBorder: '#fed7aa' },
  sun:       { Icon: Sun,       bg: 'bg-yellow-50',  color: 'text-yellow-500',  tagBg: '#fefce8', tagText: '#a16207', tagBorder: '#fef08a' },
  heart:     { Icon: Heart,     bg: 'bg-pink-50',    color: 'text-pink-400',    tagBg: '#fdf2f8', tagText: '#db2777', tagBorder: '#fbcfe8' },
  leaf:      { Icon: Leaf,      bg: 'bg-green-50',   color: 'text-green-600',   tagBg: '#f0fdf4', tagText: '#16a34a', tagBorder: '#bbf7d0' },
  home:      { Icon: Home,      bg: 'bg-green-50',   color: 'text-green-600',   tagBg: '#f0fdf4', tagText: '#16a34a', tagBorder: '#bbf7d0' },
  sprout:    { Icon: Sprout,    bg: 'bg-emerald-50', color: 'text-emerald-600', tagBg: '#ecfdf5', tagText: '#059669', tagBorder: '#a7f3d0' },
  coffee:    { Icon: Coffee,    bg: 'bg-amber-50',   color: 'text-amber-500',   tagBg: '#fffbeb', tagText: '#d97706', tagBorder: '#fde68a' },
  wheat:     { Icon: Wheat,     bg: 'bg-yellow-50',  color: 'text-yellow-600',  tagBg: '#fefce8', tagText: '#a16207', tagBorder: '#fef08a' },
  salad:     { Icon: Salad,     bg: 'bg-green-50',   color: 'text-green-600',   tagBg: '#f0fdf4', tagText: '#16a34a', tagBorder: '#bbf7d0' },
  beef:      { Icon: Beef,      bg: 'bg-red-50',     color: 'text-red-500',     tagBg: '#fef2f2', tagText: '#dc2626', tagBorder: '#fecaca' },
  drumstick: { Icon: Drumstick, bg: 'bg-amber-50',   color: 'text-amber-600',   tagBg: '#fffbeb', tagText: '#d97706', tagBorder: '#fde68a' },
  egg:       { Icon: Egg,       bg: 'bg-yellow-50',  color: 'text-yellow-600',  tagBg: '#fefce8', tagText: '#a16207', tagBorder: '#fef08a' },
  chefhat:   { Icon: ChefHat,   bg: 'bg-green-50',   color: 'text-green-700',   tagBg: '#f0fdf4', tagText: '#15803d', tagBorder: '#bbf7d0' },
  flame:     { Icon: Flame,     bg: 'bg-orange-50',  color: 'text-orange-600',  tagBg: '#fff7ed', tagText: '#ea580c', tagBorder: '#fed7aa' },
  apple:     { Icon: Apple,     bg: 'bg-red-50',     color: 'text-red-400',     tagBg: '#fef2f2', tagText: '#f87171', tagBorder: '#fecaca' },
  soup:      { Icon: Soup,      bg: 'bg-orange-50',  color: 'text-orange-500',  tagBg: '#fff7ed', tagText: '#ea580c', tagBorder: '#fed7aa' },
  pizza:     { Icon: Pizza,     bg: 'bg-yellow-50',  color: 'text-yellow-600',  tagBg: '#fefce8', tagText: '#a16207', tagBorder: '#fef08a' },
  sandwich:  { Icon: Sandwich,  bg: 'bg-amber-50',   color: 'text-amber-600',   tagBg: '#fffbeb', tagText: '#d97706', tagBorder: '#fde68a' },
  carrot:    { Icon: Carrot,    bg: 'bg-orange-50',  color: 'text-orange-500',  tagBg: '#fff7ed', tagText: '#ea580c', tagBorder: '#fed7aa' },
  cherry:    { Icon: Cherry,    bg: 'bg-pink-50',    color: 'text-pink-500',    tagBg: '#fdf2f8', tagText: '#ec4899', tagBorder: '#fbcfe8' },
  cookie:    { Icon: Cookie,    bg: 'bg-amber-50',   color: 'text-amber-600',   tagBg: '#fffbeb', tagText: '#d97706', tagBorder: '#fde68a' },
}

function FoodItemIcon({ value }: { value: string }) {
  const mapped = FOOD_ICON_MAP[value?.toLowerCase()?.trim() ?? '']
  if (mapped) {
    const { Icon, bg, color } = mapped
    return (
      <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={28} strokeWidth={1.5} className={color} />
      </div>
    )
  }
  return (
    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
      <span className="text-3xl leading-none">{value || '🍽️'}</span>
    </div>
  )
}

function HighlightIcon({ value }: { value: string }) {
  const mapped = FOOD_ICON_MAP[value?.toLowerCase()?.trim() ?? '']
  if (mapped) {
    const { Icon } = mapped
    return <Icon size={32} strokeWidth={1.5} className="text-green-600" />
  }
  return <span className="text-3xl leading-none">{value || '🌿'}</span>
}

const FOOD_HERO_FALLBACK = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=70'

export default function FoodBlock({ data }: Props) {
  const items      = data.items      ?? []
  const highlights = data.highlights ?? []

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">

      {/* Header */}
      <div className="p-6 space-y-2">
        {data.label && (
          <p className="text-xs font-bold uppercase tracking-widest text-green-700">{data.label}</p>
        )}
        {data.title && (
          <h2 className="text-2xl font-bold text-stone-900 leading-tight">{data.title}</h2>
        )}
        {data.description && (
          <div className="space-y-2">
            {(data.description ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} className="text-sm text-stone-500 leading-relaxed">{para}</p>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="px-5 pt-3 pb-4">
          {items.map(item => {
            const iconMeta = FOOD_ICON_MAP[(item.emoji ?? '').toLowerCase().trim()]
            return (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl border border-stone-100 mb-3 last:mb-0">
              <FoodItemIcon value={item.emoji ?? ''} />
              <div className="flex-1 min-w-0 space-y-1">
                {item.name && <p className="text-base font-bold text-stone-900">{item.name}</p>}
                {item.desc && (item.desc ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
                  <p key={i} className="text-sm text-stone-500">{para}</p>
                ))}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full font-medium border"
                        style={iconMeta
                          ? { backgroundColor: iconMeta.tagBg, color: iconMeta.tagText, borderColor: iconMeta.tagBorder }
                          : { backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                      >{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {item.image_url && (
                <div className="relative w-36 h-28 rounded-2xl overflow-hidden shrink-0">
                  <Image
                    src={supabaseImgUrl(item.image_url, { width: 300, quality: 75 })}
                    alt={item.name || 'Food'}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                </div>
              )}
            </div>
          )
          })}
        </div>
      )}

      {/* Highlights strip */}
      {highlights.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50 grid grid-cols-4 divide-x divide-stone-100">
          {highlights.map(h => (
            <div key={h.id} className="flex flex-col items-center gap-0.5 py-4 px-2 text-center">
              <HighlightIcon value={h.icon} />
              <p className="text-sm font-bold text-green-700 mt-1">{h.label}</p>
              <p className="text-xs text-stone-400">{h.sublabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
