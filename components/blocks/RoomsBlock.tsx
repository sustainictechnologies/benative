import Image from 'next/image'
import { BedDouble, Users } from 'lucide-react'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface Room {
  id:        string
  image_url: string | null
  name:      string
  guests:    string
  price?:    string
  details?:  string
}

interface Props {
  data: {
    label?:       string
    title?:       string
    description?: string
    count_stat?:  string
    guests_stat?: string
    rooms?:       Room[]
  }
}

export default function RoomsBlock({ data }: Props) {
  const rooms = data.rooms ?? []
  if (rooms.length === 0) return null

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">

      {/* Header */}
      <div className="space-y-3">
        {data.label && (
          <p className="text-xs font-bold uppercase tracking-widest text-green-700">{data.label}</p>
        )}
        <div>
          <h2 className="text-2xl font-bold text-stone-900 leading-tight">
            {data.title || 'Comfortable Rooms, Peaceful Stay'}
          </h2>
          <div className="w-8 h-0.5 bg-green-600 mt-2 rounded-full" />
        </div>
        {data.description && (
          <div className="space-y-2">
            {(data.description ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} className="text-sm text-stone-500 leading-relaxed">{para}</p>
            ))}
          </div>
        )}

        {/* Stat pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5">
            <BedDouble size={13} className="text-green-700 shrink-0" />
            <span className="text-xs font-semibold text-stone-700">
              {data.count_stat || `${rooms.length} Room${rooms.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {data.guests_stat && (
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5">
              <Users size={13} className="text-green-700 shrink-0" />
              <span className="text-xs font-semibold text-stone-700">{data.guests_stat}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3-column card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="rounded-xl border border-stone-200 overflow-hidden bg-white">
            {room.image_url && (
              <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full">
                <Image
                  src={supabaseImgUrl(room.image_url, { width: 400, quality: 75 })}
                  alt={room.name || 'Room'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
            )}
            <div className="p-4 space-y-1.5">
              {room.name && <p className="text-base font-bold text-stone-900">{room.name}</p>}
              {room.guests && (
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-stone-400 shrink-0" />
                  <span className="text-sm text-stone-500">{room.guests}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
