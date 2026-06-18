'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { HomestayWithCategories } from '@/types/blocks.types'

interface Props {
  homestay: HomestayWithCategories
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function PlaceCard({ homestay: h, isHighlighted, onMouseEnter, onMouseLeave }: Props) {
  return (
    <Link
      href={`/homestays/${h.slug}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
        isHighlighted
          ? 'border-brand-400 shadow-md'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-md'
      }`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {h.cover_image_url ? (
          <img
            src={h.cover_image_url}
            alt={h.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={28} className="text-stone-300" />
          </div>
        )}
      </div>

      {/* Name + location */}
      <div className="px-2 py-2">
        <p className="font-serif text-[12px] text-stone-900 leading-snug line-clamp-1">{h.title}</p>
        <p className="flex items-center gap-0.5 text-[10px] text-stone-400 mt-0.5 truncate">
          <MapPin size={9} className="shrink-0" />
          {h.village_name}, {h.location_district}
        </p>
      </div>
    </Link>
  )
}
