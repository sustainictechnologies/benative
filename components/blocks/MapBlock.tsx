import { MapPin, Globe2 } from 'lucide-react'

interface Props {
  data: {
    location?:     string
    region?:       string
    nearest_town?: string
  }
}

export default function MapBlock({ data }: Props) {
  if (!data.location && !data.region) return null

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-brand-600" />
        <h2 className="font-semibold text-stone-900">Location</h2>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-green-100 via-green-50 to-stone-100 border border-stone-200" style={{ height: 140 }}>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-1.5">
          <span className="text-3xl">📍</span>
          {data.location && <p className="text-sm font-semibold text-stone-700">{data.location}</p>}
          {data.region   && <p className="text-xs text-stone-400">{data.region}</p>}
        </div>
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[20,40,60,80].map(v => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#16a34a" strokeWidth="0.5"/>
              <line x1="0" y1={v} x2="100" y2={v} stroke="#16a34a" strokeWidth="0.5"/>
            </g>
          ))}
        </svg>
      </div>

      {data.nearest_town && (
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Globe2 size={14} className="text-stone-400 shrink-0" />
          <span>{data.nearest_town}</span>
        </div>
      )}
    </div>
  )
}
