'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Monitor, Smartphone, CheckCircle2, AlertCircle, XCircle, ChevronDown, Lock } from 'lucide-react'
import type { HomestaySeo } from '@/lib/homestaySeo'
import {
  type CheckStatus, type SeoAnalysis, type SeoGroup,
  TITLE_MAX, DESCRIPTION_MAX, titleLengthStatus, descriptionLengthStatus, scoreStatus,
} from './seoChecks'

interface Props {
  open:            boolean
  onClose:         () => void
  seo:             HomestaySeo
  onChange:        (seo: HomestaySeo) => void
  autoTitle:       string
  autoDescription: string
  slug:            string
  analysis:        SeoAnalysis
}

const TONE: Record<CheckStatus, { text: string; soft: string; bar: string }> = {
  good: { text: 'text-emerald-700', soft: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
  ok:   { text: 'text-amber-700',   soft: 'bg-amber-50 border-amber-200',     bar: 'bg-amber-500'   },
  bad:  { text: 'text-rose-700',    soft: 'bg-rose-50 border-rose-200',       bar: 'bg-rose-500'    },
}

const STATUS_ICON: Record<CheckStatus, typeof CheckCircle2> = { good: CheckCircle2, ok: AlertCircle, bad: XCircle }

function ScoreBadge({ score }: { score: number }) {
  const tone = TONE[scoreStatus(score)]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold tabular-nums ${tone.soft} ${tone.text}`}>
      {score} / 100
    </span>
  )
}

/* ─── Google result preview ──────────────────────────────── */
// Close to Google's own fonts and sizes; Google decides the exact point where it cuts the text
function GoogleSnippet({ title, description, slug, device }: { title: string; description: string; slug: string; device: 'desktop' | 'mobile' }) {
  const mobile = device === 'mobile'
  return (
    <div
      className={`bg-white rounded-xl border border-stone-200 px-4 py-3.5 ${mobile ? 'max-w-[380px] mx-auto' : ''}`}
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">B</div>
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] text-[#202124] truncate">BeNative</p>
          <p className="text-[12px] text-[#4d5156] truncate">https://www.benative.in › homestays › {slug || '…'}</p>
        </div>
      </div>
      <p className={`text-[#1a0dab] ${mobile ? 'text-[18px] leading-6 line-clamp-2' : 'text-[20px] leading-[26px] truncate'}`}>
        {title}
      </p>
      <p className={`text-[14px] leading-[22px] text-[#4d5156] mt-1 ${mobile ? 'line-clamp-3' : 'line-clamp-2'}`}>
        {description}
      </p>
    </div>
  )
}

/* ─── Title / description field ──────────────────────────── */
function SeoField({
  label, hint, value, automatic, max, status, multiline, onChange,
}: {
  label: string; hint: string; value: string; automatic: string; max: number; status: CheckStatus
  multiline?: boolean; onChange: (value: string) => void
}) {
  const length = (value.trim() || automatic).length
  const tone   = TONE[status]
  const inputClass = 'w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-brand-400'

  return (
    <div className="rounded-xl bg-stone-50 border border-stone-100 p-3.5">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-xs font-bold text-stone-700">{label}</p>
        <span className={`text-[11px] font-mono ${tone.text}`}>{length} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${Math.min(length / max, 1) * 100}%` }} />
      </div>
      {multiline
        ? <textarea value={value} placeholder={automatic} onChange={e => onChange(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        : <input value={value} placeholder={automatic} onChange={e => onChange(e.target.value)} className={inputClass} />}
      <div className="flex items-start justify-between gap-3 mt-1.5">
        <p className="text-[11px] text-stone-400 leading-relaxed">{hint}</p>
        {value.trim()
          ? <button onClick={() => onChange('')} className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 shrink-0">Back to automatic</button>
          : <button onClick={() => onChange(automatic)} className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 shrink-0">Edit automatic text</button>}
      </div>
    </div>
  )
}

/* ─── One group of checks ────────────────────────────────── */
function CheckGroup({ group }: { group: SeoGroup }) {
  const [open, setOpen] = useState(true)
  const bad    = group.checks.filter(c => c.status === 'bad').length
  const issues = group.checks.filter(c => c.status !== 'good').length
  const badge  = TONE[bad ? 'bad' : issues ? 'ok' : 'good']

  return (
    <div className="border-b border-stone-100 last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-1 py-3 text-left">
        <span className="text-sm font-bold text-stone-800">{group.name}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.soft} ${badge.text}`}>
          {issues ? `${issues} to fix` : 'All good'}
        </span>
        <ChevronDown size={15} className={`ml-auto text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="pb-3 space-y-2.5">
          {group.checks.map(check => {
            const Icon = STATUS_ICON[check.status]
            return (
              <li key={check.id} className="flex items-start gap-2.5 px-1">
                <Icon size={16} className={`${TONE[check.status].text} shrink-0 mt-px`} />
                <div className="min-w-0">
                  <p className="text-[13px] text-stone-800 leading-snug">{check.label}</p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">{check.detail}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ─── Panel ──────────────────────────────────────────────── */
export default function SeoPanel({ open, onClose, seo, onChange, autoTitle, autoDescription, slug, analysis }: Props) {
  const [tab, setTab]       = useState<'preview' | 'checks'>('preview')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const title       = seo.title.trim()       || autoTitle
  const description = seo.description.trim() || autoDescription

  return (
    <div className="fixed inset-0 z-[250] flex justify-end bg-black/30" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.aside
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full sm:w-[640px] h-full bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-5 pt-4 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3">
            <p className="font-bold text-stone-900">SEO</p>
            <ScoreBadge score={analysis.score} />
            <button onClick={onClose} title="Close" className="ml-auto text-stone-400 hover:text-stone-700 transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">How this page shows in Google, and what would help it be found.</p>
          <div className="flex gap-1 mt-3">
            {([['preview', 'Google preview'], ['checks', 'Checks']] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === 'preview' ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Preview</p>
                  <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5">
                    {(['desktop', 'mobile'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDevice(d)}
                        title={d === 'desktop' ? 'Computer' : 'Phone'}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${device === d ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        {d === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
                      </button>
                    ))}
                  </div>
                </div>
                <GoogleSnippet title={title} description={description} slug={slug} device={device} />
              </div>

              <SeoField
                label="SEO title"
                hint="The blue link in Google and the name in the browser tab."
                value={seo.title}
                automatic={autoTitle}
                max={TITLE_MAX}
                status={titleLengthStatus(title.length)}
                onChange={value => onChange({ ...seo, title: value })}
              />

              <div className="rounded-xl bg-stone-50 border border-stone-100 p-3.5">
                <p className="text-xs font-bold text-stone-700 mb-1.5">Page address</p>
                <div className="flex items-center gap-2 text-sm border border-stone-200 rounded-lg px-3 py-2 bg-stone-100 text-stone-500">
                  <Lock size={12} className="shrink-0" />
                  <span className="truncate">benative.in/homestays/<span className="text-stone-800 font-medium">{slug || '…'}</span></span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed mt-1.5">
                  Made from the homestay name. It stays fixed here: changing the address of a live page breaks links already shared and found in Google.
                </p>
              </div>

              <SeoField
                label="SEO description"
                hint="The text under the title in Google and on shared links."
                value={seo.description}
                automatic={autoDescription}
                max={DESCRIPTION_MAX}
                status={descriptionLengthStatus(description.length)}
                multiline
                onChange={value => onChange({ ...seo, description: value })}
              />
            </>
          ) : (
            <>
              <div className="rounded-xl bg-stone-50 border border-stone-100 p-3.5">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-xs font-bold text-stone-700">Focus keyword</p>
                  <ScoreBadge score={analysis.score} />
                </div>
                <input
                  value={seo.keyword}
                  onChange={e => onChange({ ...seo, keyword: e.target.value })}
                  placeholder="e.g. homestay in Khed"
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-brand-400"
                />
                <p className="text-[11px] text-stone-400 leading-relaxed mt-1.5">
                  The search phrase this page should be found for. Only these checks use it: it is not shown on the page.
                </p>
              </div>

              <div>
                {analysis.groups.map(group => <CheckGroup key={group.name} group={group} />)}
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                A guide for writing, not Google&apos;s own score. Write for guests first: repeating the keyword just to turn a check green makes the page read worse.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 text-[11px] text-stone-400 shrink-0">
          Saved with Save Draft and Publish. The live page changes when you publish.
        </div>
      </motion.aside>
    </div>
  )
}
