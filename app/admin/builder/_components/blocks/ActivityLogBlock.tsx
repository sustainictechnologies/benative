'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Check, Upload, Loader2 } from 'lucide-react'
import { useBuilder } from '../BuilderContext'
import { ALL_ACTIVITIES } from '@/lib/activities'
import { createClient } from '@/lib/supabase/client'
import { createCustomActivity } from '@/lib/actions/customActivities'

export interface ActivityItem {
  id: string
  label: string
  emoji: string
  desc: string
  iconUrl?: string
  isCustom?: boolean
}

const DEFAULT_IDS = ['birding', 'farm', 'monsoon']

const EMOJI_OPTIONS = [
  '🌿','🌾','🌲','🌳','🌴','🍃','🌺','🌸','🌻','🌼',
  '🦜','🦋','🐝','🐠','🐟','🦅','🦚','🐘','🦁','🐆',
  '🏕️','🏔️','🗻','🌋','🏞️','🏖️','🌊','🌅','⛺','🛶',
  '🎣','🚴','🥾','🧘','🏹','🎨','🎭','🎊','🔥','⭐',
  '🍛','🫖','🌙','☀️','🌧️','❄️','🎯','🏺','📷','🎵',
]

function defaultSelected(): ActivityItem[] {
  return DEFAULT_IDS.map(id => {
    const a = ALL_ACTIVITIES.find(x => x.id === id)!
    return { id, label: a.label, emoji: a.emoji, desc: a.desc }
  })
}

function parseSelected(raw: string): ActivityItem[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return parsed.length === 0 ? [] : defaultSelected()
    if (typeof parsed[0] === 'string') {
      // Migrate old format (array of IDs) to full objects
      return parsed.map((id: string) => {
        const a = ALL_ACTIVITIES.find(x => x.id === id)
        return a ? { id, label: a.label, emoji: a.emoji, desc: a.desc } : { id, label: id, emoji: '🎯', desc: '' }
      })
    }
    return parsed as ActivityItem[]
  } catch {
    return defaultSelected()
  }
}

interface Props { blockId: string }

export default function ActivityLogBlock({ blockId }: Props) {
  const { getText, updateText, previewMode } = useBuilder()
  const [showPicker, setShowPicker]         = useState(false)
  const [customList, setCustomList]         = useState<ActivityItem[]>([])
  const [showCreate, setShowCreate]         = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [newLabel, setNewLabel]             = useState('')
  const [newDesc, setNewDesc]               = useState('')
  const [newEmoji, setNewEmoji]             = useState('🎯')
  const [newIconUrl, setNewIconUrl]         = useState('')
  const [uploading, setUploading]           = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [formErr, setFormErr]               = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  const selected    = parseSelected(getText(blockId, 'activities', JSON.stringify(DEFAULT_IDS)))
  const selectedIds = selected.map(a => a.id)

  // Load custom activities from Supabase
  useEffect(() => {
    createClient()
      .from('custom_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCustomList(data.map(d => ({
          id:       d.id,
          label:    d.label,
          emoji:    d.emoji   ?? '🎯',
          desc:     d.description ?? '',
          iconUrl:  d.icon_url ?? undefined,
          isCustom: true,
        })))
      })
  }, [])

  const allActivities: ActivityItem[] = [
    ...ALL_ACTIVITIES.map(a => ({ ...a, isCustom: false as const })),
    ...customList,
  ]

  const toggle = (activity: ActivityItem) => {
    const next = selectedIds.includes(activity.id)
      ? selected.filter(x => x.id !== activity.id)
      : [...selected, { id: activity.id, label: activity.label, emoji: activity.emoji, desc: activity.desc, iconUrl: activity.iconUrl, isCustom: activity.isCustom }]
    updateText(blockId, 'activities', JSON.stringify(next))
  }

  const handleIconUpload = async (file: File) => {
    setUploading(true); setFormErr('')
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop()
      const path = `activity-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('homestay-images').upload(path, file, { upsert: false })
      if (error) { setFormErr(error.message); return }
      const { data: { publicUrl } } = supabase.storage.from('homestay-images').getPublicUrl(path)
      setNewIconUrl(publicUrl)
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!newLabel.trim()) return
    setSaving(true); setFormErr('')
    try {
      const result = await createCustomActivity({
        label:       newLabel.trim(),
        description: newDesc.trim() || null,
        emoji:       newEmoji,
        icon_url:    newIconUrl || null,
      })
      if (!result.success) { setFormErr(result.error); return }
      const data = result.data
      const item: ActivityItem = { id: data.id, label: data.label, emoji: data.emoji ?? '🎯', desc: data.description ?? '', iconUrl: data.icon_url ?? undefined, isCustom: true }
      setCustomList(prev => [item, ...prev])
      updateText(blockId, 'activities', JSON.stringify([...selected, item]))
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => { setNewLabel(''); setNewDesc(''); setNewEmoji('🎯'); setNewIconUrl(''); setFormErr(''); setShowCreate(false); setShowEmojiPicker(false) }

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return
    const handler = (e: MouseEvent) => { if (!pickerRef.current?.contains(e.target as Node)) setShowPicker(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <h2 className="font-semibold text-stone-900 text-sm">Activity Log</h2>
        </div>

        {!previewMode && (
          <div className="relative" ref={pickerRef}>
            <button
              onClick={e => { e.stopPropagation(); setShowPicker(v => !v) }}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                showPicker ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-400 shadow-sm'
              }`}
            >
              <Plus size={11} strokeWidth={2.5} /> Add Activity
            </button>

            {showPicker && (
              <div
                className="absolute right-0 top-9 z-50 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 pt-3 pb-2 border-b border-stone-100">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Select Activities</p>
                </div>

                {/* Activity list */}
                <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
                  {allActivities.map(a => {
                    const active = selectedIds.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggle(a)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          active ? 'bg-brand-50 border border-brand-200' : 'hover:bg-stone-50 border border-transparent'
                        }`}
                      >
                        {a.iconUrl ? (
                          <img src={a.iconUrl} alt={a.label} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        ) : (
                          <span className="text-lg shrink-0">{a.emoji}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-800 leading-none">{a.label}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5 truncate">{a.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${active ? 'bg-brand-600' : 'border-2 border-stone-200'}`}>
                          {active && <Check size={11} className="text-white" strokeWidth={2.5} />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Create custom activity */}
                <div className="border-t border-stone-100">
                  {!showCreate ? (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Plus size={12} /> Create Custom Activity
                    </button>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">New Activity</p>

                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(v => !v)}
                            className="w-12 h-[30px] border border-stone-200 rounded-lg text-center text-sm hover:border-brand-400 transition-colors bg-stone-50"
                          >
                            {newEmoji}
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute left-0 top-9 z-10 w-64 bg-white border border-stone-200 rounded-xl shadow-xl p-2">
                              <div className="grid grid-cols-10 gap-0.5">
                                {EMOJI_OPTIONS.map(e => (
                                  <button
                                    key={e}
                                    type="button"
                                    onClick={() => { setNewEmoji(e); setShowEmojiPicker(false) }}
                                    className={`w-6 h-6 flex items-center justify-center rounded text-base hover:bg-brand-50 transition-colors ${newEmoji === e ? 'bg-brand-100' : ''}`}
                                  >
                                    {e}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          value={newLabel}
                          onChange={e => setNewLabel(e.target.value)}
                          className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400"
                          placeholder="Activity name *"
                        />
                      </div>

                      <input
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400"
                        placeholder="Short description"
                      />

                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleIconUpload(f) }} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className={`w-full flex items-center justify-center gap-1.5 border border-dashed rounded-lg py-2 text-[11px] transition-all ${
                          newIconUrl ? 'border-brand-400 text-brand-600 bg-brand-50' : 'border-stone-300 text-stone-500 hover:border-brand-400 hover:text-brand-600'
                        }`}
                      >
                        {uploading
                          ? <><Loader2 size={11} className="animate-spin" /> Uploading…</>
                          : newIconUrl
                            ? '✓ Icon uploaded'
                            : <><Upload size={11} /> Upload Icon (optional)</>
                        }
                      </button>

                      {formErr && <p className="text-[10px] text-red-500">{formErr}</p>}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={resetForm}
                          className="flex-1 text-[11px] font-semibold text-stone-500 hover:text-stone-700 py-1.5 border border-stone-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreate}
                          disabled={!newLabel.trim() || saving}
                          className="flex-1 text-[11px] font-semibold bg-brand-600 text-white py-1.5 rounded-lg disabled:opacity-50 hover:bg-brand-700 transition-colors flex items-center justify-center gap-1"
                        >
                          {saving ? <><Loader2 size={10} className="animate-spin" /> Saving…</> : 'Create & Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-3 py-2 border-t border-stone-100 bg-stone-50">
                  <button onClick={() => setShowPicker(false)} className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors">Done</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected activities grid */}
      {selected.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-brand-100 rounded-xl">
          <p className="text-sm text-stone-400">No activities added yet</p>
          {!previewMode && <p className="text-xs text-stone-300 mt-1">Click "+ Add Activity" above to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {selected.map(a => (
            <div key={a.id} className="relative group/act flex items-start gap-2.5 p-3 bg-white border border-stone-100 rounded-xl hover:border-brand-200 hover:shadow-sm transition-all">
              {a.iconUrl ? (
                <img src={a.iconUrl} alt={a.label} className="w-8 h-8 rounded-lg object-cover shrink-0 mt-0.5" />
              ) : (
                <span className="text-xl shrink-0 mt-0.5">{a.emoji}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-900 leading-tight">{a.label}</p>
                <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{a.desc}</p>
              </div>
              {!previewMode && (
                <button
                  onClick={e => { e.stopPropagation(); toggle(a) }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover/act:opacity-100 transition-all flex items-center justify-center"
                >
                  <X size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
