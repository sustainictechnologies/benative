import Link from 'next/link'
import { MapPin, Home, Compass, Sparkles, Star } from 'lucide-react'

type MainCat = {
  key: string
  label: string
  icon: React.ElementType
  img: string
  alt: string
}

const CATEGORIES: MainCat[] = [
  { key: 'place',      label: 'By the Place',      icon: MapPin,    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70', alt: 'Coastal place'         },
  { key: 'home',       label: 'By the Home',        icon: Home,      img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=70', alt: 'Family home'           },
  { key: 'trip',       label: 'By the Trip',        icon: Compass,   img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70', alt: 'Travel and trip'       },
  { key: 'experience', label: 'By the Experience',  icon: Sparkles,  img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70', alt: 'Local experience'      },
  { key: 'new',        label: 'Recently Added',     icon: Star,      img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=70', alt: 'Newly added homestays' },
]

export default function CategorySection({ imageMap = {} }: { imageMap?: Record<string, string> }) {
  return (
    <section className="bg-[#f8f7f2] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto">

        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Explore by Categories</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.key}
              href={`/discover?cat=${cat.key}`}
              className={`group relative rounded-xl overflow-hidden aspect-[3/4] transition-all duration-200 ${
                i === 4 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageMap[`cat_${cat.key}`] ?? cat.img}
                alt={cat.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/65" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <cat.icon size={32} className="text-white/90 drop-shadow-md" />
                <span className="text-white font-semibold text-sm leading-tight text-center px-2">{cat.label}</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
