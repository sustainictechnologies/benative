import { ALL_ACTIVITIES } from '@/lib/activities'

interface ActivityItem {
  id: string
  label: string
  emoji: string
  desc: string
  iconUrl?: string
}

interface Props {
  data: {
    highlight_species?: (string | ActivityItem)[]
  }
}

export default function BirdingLogBlock({ data }: Props) {
  const raw = data.highlight_species ?? []

  const activities: ActivityItem[] = raw.map(item => {
    if (typeof item === 'string') {
      const a = ALL_ACTIVITIES.find(x => x.id === item)
      return a ? { id: item, label: a.label, emoji: a.emoji, desc: a.desc } : { id: item, label: item, emoji: '🧭', desc: '' }
    }
    return item
  })

  if (activities.length === 0) return null

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-5 space-y-4">

      <div className="flex items-center gap-2">
        <span className="text-lg">🧭</span>
        <h2 className="font-semibold text-stone-900 text-sm">Activity Log</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {activities.map(a => (
          <div
            key={a.id}
            className="flex items-start gap-2.5 p-3 bg-white border border-stone-100 rounded-xl hover:border-brand-200 hover:shadow-sm transition-all"
          >
            {a.iconUrl ? (
              <img src={a.iconUrl} alt={a.label} className="w-8 h-8 rounded-lg object-cover shrink-0 mt-0.5" />
            ) : (
              <span className="text-xl shrink-0 mt-0.5">{a.emoji}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 leading-tight">{a.label}</p>
              {a.desc && (
                <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{a.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
