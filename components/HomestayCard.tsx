import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ShieldCheck, Phone } from 'lucide-react'
import type { HomestayWithCategories } from '@/types/blocks.types'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface Props {
  homestay: HomestayWithCategories
}

export default function HomestayCard({ homestay: h }: Props) {
  return (
    <Link
      href={`/homestays/${h.slug}`}
      className="block rounded-xl border border-stone-200 overflow-hidden bg-white hover:shadow-md hover:border-brand-200 transition-all duration-200"
    >
      {/* Cover image — fixed 3:2 aspect ratio */}
      <div className="relative w-full aspect-[3/2] bg-stone-100 overflow-hidden">
        {h.cover_image_url ? (
          <Image
            src={supabaseImgUrl(h.cover_image_url, { width: 600, quality: 75 })}
            alt={h.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 30vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-100 to-stone-200 flex items-center justify-center">
            <MapPin size={24} className="text-brand-300" />
          </div>
        )}
        {h.is_verified && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-brand-700 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
            <ShieldCheck size={11} /> Verified
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-stone-900 leading-snug mb-1 line-clamp-2">{h.title}</h3>

        <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{h.village_name}, {h.location_district}</span>
        </div>

        {h.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {h.categories.slice(0, 2).map((c) => (
              <span
                key={c.id}
                className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full"
              >
                {c.name}
              </span>
            ))}
            {h.categories.length > 2 && (
              <span className="text-xs text-stone-400">+{h.categories.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-stone-400">
          <Phone size={9} className="shrink-0" />
          <span className="truncate">Call {h.calling_window}</span>
        </div>
      </div>
    </Link>
  )
}
