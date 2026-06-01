import { ScrollText } from 'lucide-react'

interface RulesSection {
  id:    string
  title: string
  items: string[]
}

interface RulesRow {
  rowId: string
  cols:  RulesSection[]
}

interface Props {
  data: {
    title?:    string
    sections?: RulesRow[]
    // Legacy fields for backwards compat
    house_policies?:   string[]
    prohibited_items?: string[]
    safety_status?:    string
  }
}

function LegacyRulesBlock({ data }: Props) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ScrollText size={18} className="text-stone-500" />
        <h2 className="font-semibold text-stone-900">House Rules & Safety</h2>
      </div>
      {(data.house_policies ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">House policies</h3>
          <ul className="space-y-1.5">
            {(data.house_policies ?? []).map(p => (
              <li key={p} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="mt-1.5 w-1.5 h-1.5 bg-stone-400 rounded-full shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(data.prohibited_items ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Please do not bring</h3>
          <ul className="space-y-1.5">
            {(data.prohibited_items ?? []).map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                <span className="mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function RulesBlock({ data }: Props) {
  const rows = data.sections ?? []

  if (rows.length === 0) return <LegacyRulesBlock data={data} />

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText size={18} className="text-stone-500" />
        <h2 className="font-semibold text-stone-900">{data.title || 'House Rules & Safety'}</h2>
      </div>

      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.rowId} className="flex gap-3 flex-wrap">
            {row.cols.map(col => (
              <div
                key={col.id}
                className="flex-1 min-w-[160px] bg-white border border-stone-200 rounded-xl p-4 space-y-2"
              >
                {col.title && (
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {col.title}
                  </h3>
                )}
                {col.items?.length > 0 && (
                  <ul className="space-y-1.5">
                    {col.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-stone-400 rounded-full shrink-0" />
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
    </div>
  )
}
