'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, Clock, BookOpen } from 'lucide-react'
import { discardDraft } from '../actions'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface Draft {
  id:          string
  title:       string
  slug:        string
  updatedAt:   string
  coverImage:  string | null
  isPublished: boolean
  isDraftOnly: boolean
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function DraftsClient({ drafts }: { drafts: Draft[] }) {
  const router  = useRouter()
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null)
  const [working,     setWorking]     = useState<string | null>(null)

  const handleDiscard = async (slug: string, deleteRecord: boolean) => {
    setWorking(slug)
    await discardDraft(slug, deleteRecord)
    setConfirmSlug(null)
    setWorking(null)
    router.refresh()
  }

  if (drafts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
          <BookOpen size={26} className="text-stone-400" />
        </div>
        <p className="text-sm font-semibold text-stone-600">No drafts in progress</p>
        <p className="text-xs text-stone-400">Saved drafts from the Website Builder will appear here.</p>
        <Link
          href="/admin/builder"
          className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors"
        >
          Open Builder
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map(draft => (
          <div
            key={draft.id}
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Thumbnail */}
            <div className="h-36 bg-stone-100 relative shrink-0">
              {draft.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={supabaseImgUrl(draft.coverImage, { width: 400, quality: 70 })}
                  alt={draft.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🏡</div>
              )}
              {/* Status badge */}
              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                draft.isDraftOnly
                  ? 'bg-stone-800/70 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}>
                {draft.isDraftOnly ? 'New Draft' : 'Unsaved Changes'}
              </span>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-stone-900 leading-snug">{draft.title}</p>
                <p className="flex items-center gap-1 text-[11px] text-stone-400 mt-1">
                  <Clock size={10} /> Last edited {timeAgo(draft.updatedAt)}
                </p>
              </div>

              {/* Actions */}
              {confirmSlug === draft.slug ? (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-rose-700 font-medium flex-1">
                    {draft.isDraftOnly ? 'Delete this draft?' : 'Discard changes?'}
                  </span>
                  <button
                    onClick={() => handleDiscard(draft.slug, draft.isDraftOnly)}
                    disabled={working === draft.slug}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Check size={11} /> Yes
                  </button>
                  <button onClick={() => setConfirmSlug(null)} className="text-rose-400 hover:text-rose-600">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-auto">
                  <Link
                    href={`/admin/builder?slug=${draft.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-xl transition-colors"
                  >
                    <Pencil size={12} /> Continue Editing
                  </Link>
                  <button
                    onClick={() => setConfirmSlug(draft.slug)}
                    title={draft.isDraftOnly ? 'Delete draft' : 'Discard changes'}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
