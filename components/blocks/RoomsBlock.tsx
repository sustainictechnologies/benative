import Image from 'next/image'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface Room {
  id: string
  image_url: string | null
  name: string
  guests: string
  price: string
  details: string
}

interface Props {
  data: { title?: string; rooms?: Room[] }
}

export default function RoomsBlock({ data }: Props) {
  const rooms = data.rooms ?? []

  if (rooms.length === 0) return null

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
      <h2 className="text-base font-semibold text-stone-900">{data.title || 'Rooms & Accommodation'}</h2>
      <div className="space-y-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex gap-4 border border-stone-100 rounded-xl overflow-hidden"
          >
            {room.image_url && (
              <div className="relative w-28 h-24 shrink-0">
                <Image
                  src={supabaseImgUrl(room.image_url, { width: 300, quality: 70 })}
                  alt={room.name || 'Room'}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            )}
            <div className="flex-1 py-3 pr-4 space-y-1 min-w-0">
              {room.name    && <p className="text-sm font-semibold text-stone-900">{room.name}</p>}
              {room.guests  && <p className="text-xs text-stone-500">{room.guests}</p>}
              {room.price   && <p className="text-sm font-bold text-brand-600">{room.price}</p>}
              {room.details && <p className="text-xs text-stone-400">{room.details}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
