'use client'

import Link from 'next/link'
import { MapPin, Check } from 'lucide-react'
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
      className="group flex flex-col gap-2.5 min-w-0"
    >
      {/* Photo */}
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100 transition-shadow duration-200 ${
          isHighlighted
            ? 'ring-2 ring-brand-400 shadow-card-hover'
            : 'shadow-card group-hover:shadow-card-hover'
        }`}
      >
        {h.cover_image_url ? (
          <img
            src={h.cover_image_url}
            alt={h.title}
            className="w-full h-full object-cover saturate-[1.18] contrast-[1.06] brightness-[1.03] transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={28} className="text-stone-300" />
          </div>
        )}
        {h.is_verified && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10.5px] font-semibold leading-none text-brand-700">
            <Check size={11} strokeWidth={3} />
            Verified
          </span>
        )}
      </div>

      {/* Name + location */}
      <div className="flex flex-col gap-1 min-w-0 px-0.5">
        <p className="text-sm md:text-[15px] font-semibold text-stone-900 leading-snug line-clamp-2 md:line-clamp-1">{h.title}</p>
        <p className="flex items-center gap-1 text-[11.5px] md:text-[12.5px] text-stone-500 min-w-0">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{h.village_name}, {h.location_district}</span>
        </p>
      </div>
    </Link>
  )
}
