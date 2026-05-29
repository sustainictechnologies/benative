import { ShieldCheck, Ban, ScrollText } from 'lucide-react'
import type { RulesBlockData } from '@/types/blocks.types'

interface Props {
  data: RulesBlockData
}

export default function RulesBlock({ data }: Props) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ScrollText size={18} className="text-stone-500" />
        <h2 className="font-semibold text-stone-900">House Rules & Safety</h2>
      </div>

      {data.safety_status && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <ShieldCheck size={16} className="text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">{data.safety_status}</p>
        </div>
      )}

      {(data.house_policies ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
            House policies
          </h3>
          <ul className="space-y-1.5">
            {(data.house_policies ?? []).map((policy) => (
              <li key={policy} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="mt-1.5 w-1.5 h-1.5 bg-stone-400 rounded-full shrink-0" />
                {policy}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(data.prohibited_items ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
            Please do not bring
          </h3>
          <ul className="space-y-1.5">
            {(data.prohibited_items ?? []).map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
                <Ban size={12} className="text-rose-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}