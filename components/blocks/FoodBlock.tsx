import { Fish, Utensils, Sun, Heart, Leaf, Home, Sprout, Coffee, Wheat, Disc2, Salad, Beef, Drumstick, Egg, ChefHat, Flame, Apple, Soup, Pizza, Sandwich, Carrot, Cherry, Cookie } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FoodHighlight {
  id:       string
  icon:     string
  label:    string
  sublabel: string
}

interface FoodItem {
  id:   string
  name: string
}

interface Props {
  data: {
    label?:         string
    title?:         string
    description?:   string
    dishes_label?:  string
    items?:         FoodItem[]
    highlights?:    FoodHighlight[]
  }
}

const HIGHLIGHT_ICON_MAP: Record<string, LucideIcon> = {
  fish: Fish, utensils: Utensils, sun: Sun, heart: Heart, leaf: Leaf, home: Home,
  sprout: Sprout, coffee: Coffee, wheat: Wheat, disc2: Disc2, salad: Salad,
  beef: Beef, drumstick: Drumstick, egg: Egg, chefhat: ChefHat, flame: Flame,
  apple: Apple, soup: Soup, pizza: Pizza, sandwich: Sandwich, carrot: Carrot,
  cherry: Cherry, cookie: Cookie,
}

function HighlightIcon({ value }: { value: string }) {
  const Icon = HIGHLIGHT_ICON_MAP[value?.toLowerCase()?.trim() ?? '']
  if (Icon) return <Icon strokeWidth={1.5} className="text-green-600 w-5 h-5 sm:w-8 sm:h-8" />
  return <span className="text-xl sm:text-3xl leading-none">{value || '🌿'}</span>
}

export default function FoodBlock({ data }: Props) {
  const items      = data.items      ?? []
  const highlights = data.highlights ?? []

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">

      {/* 2-column body */}
      <div className="flex flex-col sm:flex-row">
        {/* Left: header info */}
        <div className="sm:w-2/5 p-6 space-y-3 border-b sm:border-b-0 sm:border-r border-stone-100">
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

        {/* Right: dish list */}
        <div className="sm:w-3/5 p-6">
          {(data.dishes_label || items.length > 0) && (
            <h3 className="text-base font-bold text-stone-900 mb-4">
              {data.dishes_label || 'Popular Dishes'}
            </h3>
          )}
          <div className="grid grid-cols-3 gap-x-3 gap-y-1">
            {items.map(item => (
              <div key={item.id} className="flex items-start gap-1.5 py-1">
                <span className="text-green-600 mt-0.5 shrink-0">•</span>
                <p className="text-sm text-stone-700 leading-snug">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights strip */}
      {highlights.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50 grid grid-cols-4 divide-x divide-stone-100">
          {highlights.map(h => (
            <div key={h.id} className="flex flex-col items-center gap-0.5 py-3 px-1 sm:py-4 sm:px-2 text-center">
              <HighlightIcon value={h.icon} />
              <p className="hidden sm:block text-sm font-bold text-green-700 mt-1">{h.label}</p>
              <p className="hidden sm:block text-xs text-stone-400">{h.sublabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
