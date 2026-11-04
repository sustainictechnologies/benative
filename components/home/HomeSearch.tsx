'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { searchHomestays, MIN_SEARCH_LENGTH, type SearchHit } from '@/lib/search'
import { POPULAR_SEARCHES } from '@/lib/searchPopular'
import SearchSuggestions from '@/components/SearchSuggestions'

const discoverUrl = (q: string) => (q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : '/discover')

export default function HomeSearch() {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [text, setText]       = useState('')
  const [hits, setHits]       = useState<SearchHit[] | null>(null)   // null while a search is running
  const [open, setOpen]       = useState(false)
  const [popular, setPopular] = useState<string[]>([])
  const boxRef = useRef<HTMLDivElement>(null)
  const latest = useRef(0)

  // Phones get a shorter hint in the box, so it fits beside the round Search button
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrow(phone.matches)
    update()
    phone.addEventListener('change', update)
    return () => phone.removeEventListener('change', update)
  }, [])

  const term = text.trim()

  // Suggestions, a moment after typing stops; an older answer arriving late is ignored
  useEffect(() => {
    if (term.length < MIN_SEARCH_LENGTH) { setHits(null); return }
    const ticket = ++latest.current
    setHits(null)
    const timer = setTimeout(async () => {
      const result = await searchHomestays(supabase, term)
      if (ticket === latest.current) setHits(result)
    }, 250)
    return () => clearTimeout(timer)
  }, [term, supabase])

  // Popular chips: only those that find at least one stay
  useEffect(() => {
    let cancelled = false
    Promise.all(POPULAR_SEARCHES.map(async (word) => ((await searchHomestays(supabase, word)).length > 0 ? word : null)))
      .then((words) => { if (!cancelled) setPopular(words.filter((w): w is string => !!w)) })
    return () => { cancelled = true }
  }, [supabase])

  // A click outside the search box closes the suggestions
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setOpen(false)
    router.push(discoverUrl(term))
  }

  return (
    <section className="bg-[#f8f7f2] px-4 sm:px-6 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#e8eee3] px-5 py-5 sm:px-8 sm:py-7 flex items-center gap-10">

          <div className="flex-1 min-w-0 space-y-3.5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-800">Find a Place to Belong</h2>
              <p className="text-sm text-stone-500 mt-0.5">Search your homestay by name, place or experience</p>
            </div>

            <div ref={boxRef} className="relative">
              <form
                role="search"
                onSubmit={submit}
                className="flex items-center gap-2.5 bg-white border-2 border-brand-800 rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-4 focus-within:ring-brand-100 transition-shadow"
              >
                <Search size={18} className="text-stone-400 shrink-0" aria-hidden />
                <input
                  type="text"
                  value={text}
                  onChange={(e) => { setText(e.target.value); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
                  placeholder={narrow ? 'Place, stay or experience…' : 'A place, a homestay or an experience…'}
                  aria-label="Search homestays"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-stone-800 placeholder:text-stone-400 py-1.5"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="inline-flex items-center gap-1.5 shrink-0 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold rounded-full p-2.5 sm:px-5 transition-colors"
                >
                  <Search size={16} aria-hidden />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </form>

              {/* Suggestions */}
              {open && term.length >= MIN_SEARCH_LENGTH && (
                <SearchSuggestions term={term} hits={hits} linkFor={discoverUrl} onClose={() => setOpen(false)} />
              )}
            </div>

            {/* Popular searches: scroll sideways on phones */}
            <div className="flex items-center gap-2 min-h-[34px] overflow-x-auto sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popular.length > 0 && <span className="text-sm font-medium text-stone-500 shrink-0">Popular:</span>}
              {popular.map((word) => (
                <Link
                  key={word}
                  href={discoverUrl(word)}
                  className="shrink-0 bg-white border border-[#d3ddcc] rounded-full px-3.5 py-1.5 text-sm text-stone-700 hover:border-brand-500 hover:text-brand-800 transition-colors"
                >
                  {word}
                </Link>
              ))}
            </div>
          </div>

          {/* Line drawing of hills, trees and a home (laptops only) */}
          <svg
            aria-hidden
            viewBox="0 0 220 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hidden md:block w-52 shrink-0 text-brand-600/70"
          >
            <circle cx="170" cy="22" r="11" />
            <path d="M8 104c28-8 50-30 76-52 18-15 34-15 52 0 18 15 40 36 78 48" />
            <path d="M100 104c20-14 36-22 54-22s36 8 62 20" opacity="0.6" />
            <path d="M2 106h216" />
            <path d="M58 104V82" />
            <path d="M58 62c-8 7-9 20 0 25 9-5 8-18 0-25z" />
            <path d="M74 104V86" />
            <path d="M74 70c-6 6-7 16 0 20 7-4 6-14 0-20z" />
            <path d="M112 104V86l18-13 18 13v18z" />
            <path d="M106 90l24-19 24 19" />
            <path d="M126 104v-11h8v11" />
            <path d="M150 96h22v8" />
            <path d="M178 104c-2-9 9-13 13-6 4-7 15-2 13 6" />
          </svg>

        </div>
      </div>
    </section>
  )
}
