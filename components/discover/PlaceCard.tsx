'use client'

import Link from 'next/link'
import { MapPin, Check, ArrowRight } from 'lucide-react'
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
      {/* Photo — the green ring marks the card picked on the map; under the mouse the lift and label do that job */}
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100 transition-shadow duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.14)] group-hover:shadow-[0_14px_34px_rgba(0,0,0,0.24)] ${
          isHighlighted ? 'ring-2 ring-brand-400 group-hover:ring-0' : ''
        }`}
      >
        {h.cover_image_url ? (
          <>
            <img
              src={h.cover_image_url}
              alt={h.title}
              className="w-full h-full object-cover saturate-[1.38] contrast-[1.10] brightness-[1.03] transition-transform duration-300 group-hover:scale-[1.06]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/[0.38] to-transparent to-45% pointer-events-none" />
            <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View stay
              <ArrowRight size={12} />
            </span>
          </>
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
