import { Navigation, Car, Train, Plane, Bus } from 'lucide-react'
import type { ReactNode } from 'react'

interface ReachSection {
  id:    string
  title: string
  items: string[]
}

interface ReachRow {
  rowId: string
  cols:  ReachSection[]
}

interface Props {
  data: {
    title?:    string
    sections?: ReachRow[]
  }
}

function sectionIcon(title: string): ReactNode {
  const t = title.toLowerCase()
  if (t.includes('road') || t.includes('car') || t.includes('drive')) return <Car size={14} className="text-brand-500 shrink-0" />
  if (t.includes('train') || t.includes('rail'))                       return <Train size={14} className="text-brand-500 shrink-0" />
  if (t.includes('air') || t.includes('plane') || t.includes('fly'))  return <Plane size={14} className="text-brand-500 shrink-0" />
  if (t.includes('bus'))                                                return <Bus size={14} className="text-brand-500 shrink-0" />
  return null
}

export default function HowToReachBlock({ data }: Props) {
  const rows = data.sections ?? []

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Navigation size={18} className="text-brand-600" />
        <h2 className="font-semibold text-stone-900">{data.title || 'How to Reach'}</h2>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-stone-400">No directions added yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.rowId} className="flex gap-3 flex-wrap">
              {row.cols.map(col => (
                <div
                  key={col.id}
                  className="flex-1 min-w-[160px] bg-white border border-stone-200 rounded-xl p-4 space-y-2"
                >
                  {col.title && (
                    <div className="flex items-center gap-1.5">
                      {sectionIcon(col.title)}
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                        {col.title}
                      </h3>
                    </div>
                  )}
                  {col.items?.length > 0 && (
                    <ul className="space-y-1.5">
                      {col.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="mt-1.5 w-1.5 h-1.5 bg-brand-400 rounded-full shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
