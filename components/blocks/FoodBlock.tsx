import Image from 'next/image'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface FoodItem {
  id: string
  image_url: string | null
  name: string
  desc: string
}

interface Props {
  data: {
    label?:       string
    title?:       string
    description?: string
    items?:       FoodItem[]
  }
}

export default function FoodBlock({ data }: Props) {
  const items = data.items ?? []

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
      {/* Section header */}
      <div className="space-y-1">
        {data.label && (
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            {data.label}
          </p>
        )}
        {data.title && (
          <h2 className="text-base font-semibold text-stone-900">{data.title}</h2>
        )}
        {data.description && (
          <p className="text-sm text-stone-600 leading-relaxed">{data.description}</p>
        )}
      </div>

      {/* Food items */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="flex gap-4 border border-stone-100 rounded-xl overflow-hidden"
            >
              {item.image_url && (
                <div className="relative w-24 h-20 shrink-0">
                  <Image
                    src={supabaseImgUrl(item.image_url, { width: 300, quality: 70 })}
                    alt={item.name || 'Food'}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div className="flex-1 py-3 pr-4 space-y-1 min-w-0">
                {item.name && (
                  <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                )}
                {item.desc && (
                  <p className="text-xs text-stone-500">{item.desc}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
