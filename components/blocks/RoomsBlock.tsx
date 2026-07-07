import { BedDouble } from 'lucide-react'

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
        {(data.count_stat || rooms.length > 0 || data.guests_stat) && (
          <div className="flex items-center gap-3 flex-wrap">
            {(data.count_stat || rooms.length > 0) && (
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5">
                <BedDouble size={13} className="text-green-700 shrink-0" />
                <span className="text-xs font-semibold text-stone-700">
                  {data.count_stat || `${rooms.length} Room${rooms.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            )}
            {data.guests_stat && (
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5">
                <span className="text-xs font-semibold text-stone-700">{data.guests_stat}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3-column card grid */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center shrink-0">
                  <BedDouble size={18} className="text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  {room.name && <p className="text-sm font-bold text-stone-900">{room.name}</p>}
                  {room.guests && <p className="text-xs text-stone-500 mt-0.5">{room.guests}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
