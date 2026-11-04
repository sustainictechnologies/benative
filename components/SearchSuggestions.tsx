'use client'

import Link from 'next/link'
import { Search, MapPin, Sparkles } from 'lucide-react'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'
import { groupSuggestions, type SearchHit } from '@/lib/search'

const staysWord = (n: number) => `${n} ${n === 1 ? 'stay' : 'stays'}`

// The typed letters, shown in green inside a name
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase()
  const i = q ? text.toLowerCase().indexOf(q) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span className="text-brand-700 font-bold">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400 px-2 mb-1">{title}</p>
      {children}
    </div>
  )
}

const rowClass = 'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-brand-50 focus-visible:bg-brand-50 outline-none transition-colors'

interface Props {
  term:     string
  hits:     SearchHit[] | null   // null while a search is running
  onClose:  () => void           // called on every choice
  // A place, a kind of stay or "See all": a link to this address (homepage),
  // or, without one, a search for those words on the same page (Discover)
  linkFor?: (q: string) => string
  onSearch?: (q: string) => void
}

interface ChoiceProps extends Pick<Props, 'onClose' | 'linkFor' | 'onSearch'> {
  q:         string
  className: string
  children:  React.ReactNode
}

function Choice({ q, className, children, onClose, linkFor, onSearch }: ChoiceProps) {
  if (linkFor) return <Link href={linkFor(q)} onClick={onClose} className={className}>{children}</Link>
  return <button type="button" onClick={() => { onClose(); onSearch?.(q) }} className={className}>{children}</button>
}

// The list under a search box: matching homestays, places and kinds of stay
export default function SearchSuggestions({ term, hits, onClose, linkFor, onSearch }: Props) {
  const pick   = { onClose, linkFor, onSearch }
  const groups = hits && hits.length > 0 ? groupSuggestions(term, hits) : null

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-[0_16px_44px_rgba(0,0,0,0.18)] p-3 max-h-[22rem] overflow-y-auto">
      {!hits ? (
        <p className="text-sm text-stone-400 px-2 py-1.5">Searching…</p>
      ) : hits.length === 0 ? (
        <div className="px-2 py-1.5 space-y-2.5">
          <p className="text-sm text-stone-700">No stays match “{term}” yet.</p>
          <div className="flex flex-wrap gap-2">
            <Choice q="" {...pick} className="rounded-full bg-brand-800 text-white text-xs font-semibold px-3.5 py-1.5">
              See all stays
            </Choice>
            <Link href="/recommend" className="rounded-full border border-stone-200 text-stone-700 text-xs font-medium px-3.5 py-1.5 hover:border-brand-500">
              Recommend a homestay
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Choice q={term} {...pick} className={`${rowClass} text-sm font-semibold text-brand-800`}>
            <Search size={15} aria-hidden /> See {staysWord(hits.length)} for “{term}”
          </Choice>

          {groups && groups.stays.length > 0 && (
            <Group title="Homestays">
              {groups.stays.map((h) => (
                <Link key={h.id} href={`/homestays/${h.slug}`} onClick={onClose} className={rowClass}>
                  {h.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={supabaseImgUrl(h.cover_image_url)} alt="" loading="lazy" className="w-11 h-8 rounded-md object-cover shrink-0" />
                  ) : (
                    <span className="w-11 h-8 rounded-md bg-brand-50 text-brand-700 grid place-items-center shrink-0"><MapPin size={15} /></span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-800 truncate"><Highlight text={h.title} query={term} /></span>
                    <span className="block text-xs text-stone-500 truncate">{h.village_name}, {h.location_district}</span>
                  </span>
                </Link>
              ))}
            </Group>
          )}

          {groups && groups.places.length > 0 && (
            <Group title="Places">
              {groups.places.map((p) => (
                <Choice key={p.name} q={p.name} {...pick} className={rowClass}>
                  <span className="w-11 h-8 rounded-md bg-brand-50 text-brand-700 grid place-items-center shrink-0"><MapPin size={15} /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-800 truncate"><Highlight text={p.name} query={term} /></span>
                    <span className="block text-xs text-stone-500 truncate">{p.within ? `${p.within} · ` : ''}{staysWord(p.count)}</span>
                  </span>
                </Choice>
              ))}
            </Group>
          )}

          {groups && groups.kinds.length > 0 && (
            <Group title="Kinds of stay">
              {groups.kinds.map((k) => (
                <Choice key={k.name} q={k.name} {...pick} className={rowClass}>
                  <span className="w-11 h-8 rounded-md bg-brand-50 text-brand-700 grid place-items-center shrink-0"><Sparkles size={15} /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-800 truncate"><Highlight text={k.name} query={term} /></span>
                    <span className="block text-xs text-stone-500 truncate">{k.kind === 'facility' ? 'Facility' : 'Kind of stay'} · {staysWord(k.count)}</span>
                  </span>
                </Choice>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  )
}
