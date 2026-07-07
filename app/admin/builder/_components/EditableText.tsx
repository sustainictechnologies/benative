'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { useBuilder } from './BuilderContext'

const STYLE_SUFFIXES = ['-font', '-size', '-color', '-bold', '-italic', '-align']

interface Props {
  blockId: string
  textKey: string
  defaultValue: string
  multiline?: boolean
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export default function EditableText({
  blockId,
  textKey,
  defaultValue,
  multiline = false,
  className = '',
  as: Tag = 'p',
}: Props) {
  const { getText, updateText, previewMode, setSelectedElement } = useBuilder()
  const value = getText(blockId, textKey, defaultValue)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  // Read element-specific styles stored as text keys
  const font    = getText(blockId, `${textKey}-font`,   '')
  const size    = getText(blockId, `${textKey}-size`,   '')
  const color   = getText(blockId, `${textKey}-color`,  '')
  const bold    = getText(blockId, `${textKey}-bold`,   '') === 'true'
  const italic  = getText(blockId, `${textKey}-italic`, '') === 'true'
  const align   = getText(blockId, `${textKey}-align`,  '') as React.CSSProperties['textAlign'] | ''

  const inlineStyle: React.CSSProperties = {
    ...(font   ? { fontFamily: font }                      : {}),
    ...(size   ? { fontSize: `${size}px` }                : {}),
    ...(color  ? { color }                                 : {}),
    ...(bold   ? { fontWeight: 'bold' }                   : {}),
    ...(italic ? { fontStyle: 'italic' }                  : {}),
    ...(align  ? { textAlign: align }                     : {}),
  }

  const commit = () => {
    const trimmed = draft.trim()
    updateText(blockId, textKey, trimmed || null)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(true)
    setSelectedElement({ type: 'text', blockId, textKey })
  }

  /* ── Preview mode ─────────────────────────────────────── */
  if (previewMode) {
    return <Tag className={className} style={inlineStyle}>{value}</Tag>
  }

  /* ── Editing: inline input ────────────────────────────── */
  if (editing) {
    const shared = {
      ref: inputRef as any,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') cancel()
        if (!multiline && e.key === 'Enter') { e.preventDefault(); commit() }
        if (multiline && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit()
        e.stopPropagation()
      },
      className: `w-full bg-transparent border-0 border-b-2 border-brand-400 outline-none resize-none p-0 ${className}`,
      style: { ...inlineStyle, minHeight: multiline ? 72 : undefined },
    }

    return multiline
      ? <textarea {...shared} rows={3} />
      : <input {...shared} type="text" />
  }

  /* ── Default: hoverable text ──────────────────────────── */
  return (
    <Tag
      className={`relative group/txt cursor-text ${className}`}
      style={inlineStyle}
      onClick={handleClick}
      title="Click to edit"
    >
      {value}
      <span className="absolute inset-0 rounded pointer-events-none ring-1 ring-brand-400 ring-offset-1 bg-brand-50/30 opacity-0 group-hover/txt:opacity-100 transition-opacity duration-100" />
      <span className="absolute -top-5 right-0 flex items-center gap-1 bg-brand-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none opacity-0 group-hover/txt:opacity-100 transition-opacity duration-100">
        <Pencil size={8} /> Edit
      </span>
    </Tag>
  )
}
