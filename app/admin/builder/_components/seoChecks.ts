// The SEO panel's checks and score, worked out in the browser from what is in the builder.
// Modelled on the usual SEO plugin checklists, keeping only what fits a homestay page: no "link to
// other websites" or "power word in the title" rules. A guide for writing, not Google's own score.

import type { CanvasBlock } from './BuilderTypes'
import { toSlug } from '@/lib/homestaySlug'
import { autoSeoTitle, autoSeoDescription, joinPlace } from '@/lib/homestaySeo'

export type CheckStatus = 'good' | 'ok' | 'bad'

export interface SeoCheck {
  id:     string
  label:  string
  detail: string
  status: CheckStatus
  weight: number   // the weights of all checks add up to 100
}

export interface SeoGroup {
  name:   string
  checks: SeoCheck[]
}

export interface SeoAnalysis {
  score:  number   // 0–100
  groups: SeoGroup[]
}

export interface SeoInput {
  keyword:     string
  title:       string   // the title the page will use: the panel's own, or the automatic one
  description: string   // likewise
  slug:        string
  blocks:      CanvasBlock[]
}

export const TITLE_MAX       = 60
export const DESCRIPTION_MAX = 160

// The automatic title and description of the page being built, as the live page will make them.
// Village and district come from the address as Publish splits it ("Khed, Ratnagiri, Maharashtra");
// the description starts from the host story, unless that block is hidden.
export function builderAutoSeo(name: string, address: string, blocks: CanvasBlock[]): { title: string; description: string } {
  const parts    = address.split(',').map(s => s.trim())
  const village  = parts[0] ?? address
  const district = parts[1] ?? village
  const place    = joinPlace(village, district)
  const story    = blocks.find(b => b.type === 'host-story' && !b.hidden)?.props.texts?.['story-body'] ?? ''
  return { title: autoSeoTitle(name, place), description: autoSeoDescription(name, place, story) }
}

// The score's colour: green from 80, orange from 50, red below
export function scoreStatus(score: number): CheckStatus {
  return score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad'
}

export function titleLengthStatus(length: number): CheckStatus {
  if (length >= 30 && length <= TITLE_MAX) return 'good'
  if (length > 0 && length <= 70) return 'ok'
  return 'bad'
}

export function descriptionLengthStatus(length: number): CheckStatus {
  if (length >= 120 && length <= DESCRIPTION_MAX) return 'good'
  if (length >= 50 && length <= 200) return 'ok'
  return 'bad'
}

/* ─── The page's text ────────────────────────────────────── */

interface PageText {
  headings:   string[]
  paragraphs: string[]   // in page order
  photos:     number
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function strings(list: unknown): string[] {
  return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string') : []
}

const isPhoto = (url: string | undefined) => !!url && url.startsWith('http')

// The text the published page will show: what is saved for each visible block (see lib/blockSerializer.ts)
function pageText(blocks: CanvasBlock[]): PageText {
  const headings: string[]   = []
  const paragraphs: string[] = []
  let photos = 0
  const add = (list: string[], ...values: (string | undefined)[]) =>
    values.forEach(v => { if (v?.trim()) list.push(v.trim()) })
  const joined = (...values: (string | undefined)[]) => values.filter(v => v?.trim()).join('. ')

  for (const block of blocks) {
    if (block.hidden) continue
    const txt = block.props.texts  ?? {}
    const img = block.props.images ?? {}

    switch (block.type) {
      case 'hero':
        add(paragraphs, txt['tagline'])
        if (isPhoto(img['cover'])) photos++
        break
      case 'host-story':
        add(headings, txt['story-title'])
        add(paragraphs, ...(txt['story-body'] ?? '').split(/\n+/))
        break
      case 'activity-log':
        for (const a of parseJson<unknown[]>(txt['activities'], [])) {
          if (typeof a === 'string') add(paragraphs, a)
          else if (a && typeof a === 'object') {
            const { label, desc } = a as { label?: string; desc?: string }
            add(paragraphs, joined(label, desc))
          }
        }
        break
      case 'rules-block':
      case 'how-to-reach': {
        const prefix = block.type === 'rules-block' ? 'rules' : 'reach'
        add(headings, txt[`${prefix}-title`])
        for (const row of parseJson<{ cols?: string[] }[]>(txt[`${prefix}-rows`], [])) {
          for (const col of strings(row.cols)) {
            add(headings, txt[`${col}-title`])
            add(paragraphs, ...strings(parseJson(txt[`${col}-items`], [])))
          }
        }
        break
      }
      case 'food':
        add(headings, txt['food-title'])
        add(paragraphs, txt['food-desc'])
        add(paragraphs, strings(parseJson(txt['food-meta'], [])).map(id => txt[`${id}-name`]).filter(Boolean).join(', '))
        for (const id of strings(parseJson(txt['food-highlights-meta'], []))) {
          add(paragraphs, joined(txt[`${id}-label`], txt[`${id}-sublabel`]))
        }
        break
      case 'rooms':
        add(headings, txt['rooms-title'])
        add(paragraphs, txt['rooms-desc'])
        for (const id of strings(parseJson(txt['rooms-meta'], []))) {
          add(paragraphs, joined(txt[`${id}-name`], txt[`${id}-details`]))
          if (isPhoto(img[id])) photos++
        }
        break
      case 'gallery':
        photos += Object.entries(img).filter(([key, url]) => key.startsWith('gallery-') && isPhoto(url)).length
        break
      case 'map':
        add(paragraphs, [txt['map-location'], txt['map-region'], txt['map-nearest-town']].filter(v => v?.trim()).join(', '))
        break
      default:
        break
    }

    // Any block: its extra text lines and its free layout rows
    for (const id of strings(parseJson(txt['sub-texts'], []))) add(paragraphs, txt[id])
    for (const row of parseJson<{ cells?: { id: string; type: string }[] }[]>(txt['layout-rows'], [])) {
      for (const cell of row.cells ?? []) {
        if (cell.type === 'text')  add(paragraphs, txt[cell.id])
        if (cell.type === 'list')  add(paragraphs, ...strings(parseJson(txt[`${cell.id}-items`], [])))
        if (cell.type === 'image' && isPhoto(img[cell.id])) photos++
      }
    }
  }

  return { headings, paragraphs, photos }
}

/* ─── Matching words ─────────────────────────────────────── */

// Letters (with their vowel signs, for Marathi and Hindi) and numbers make words; everything else separates them.
// Built at run time: the project's TypeScript target does not allow \p{…} in a regex literal.
const NON_WORD = new RegExp('[^\\p{L}\\p{M}\\p{N}]+', 'gu')

function normalize(text: string): string {
  return text.toLowerCase().replace(NON_WORD, ' ').trim()
}

function wordCount(text: string): number {
  const n = normalize(text)
  return n ? n.split(' ').length : 0
}

// How many times the (normalized) phrase appears as whole words
function countPhrase(text: string, phrase: string): number {
  if (!phrase) return 0
  const hay    = ` ${normalize(text)} `
  const needle = ` ${phrase} `
  let count = 0
  for (let at = hay.indexOf(needle); at !== -1; at = hay.indexOf(needle, at + needle.length - 1)) count++
  return count
}

/* ─── The checks ─────────────────────────────────────────── */

const SCORE: Record<CheckStatus, number> = { good: 1, ok: 0.5, bad: 0 }

export function analyzeSeo({ keyword, title, description, slug, blocks }: SeoInput): SeoAnalysis {
  const kw = normalize(keyword)
  const { headings, paragraphs, photos } = pageText(blocks)
  const allText = [...headings, ...paragraphs].join('\n')
  const words   = wordCount(allText)
  const uses    = countPhrase(allText, kw)

  // The checks about the focus keyword fail, with this note, until one is set
  const kwCheck = (id: string, label: string, weight: number, passes: boolean, good: string, bad: string): SeoCheck =>
    !kw
      ? { id, label, weight, status: 'bad', detail: 'Add a focus keyword above to run this check.' }
      : { id, label, weight, status: passes ? 'good' : 'bad', detail: passes ? good : bad }

  // Opening lines: the first 10% of the text, and at least its first 60 words
  const opening = normalize(paragraphs.join(' ')).split(' ')
  const openingText = opening.slice(0, Math.max(60, Math.ceil(opening.length / 10))).join(' ')

  const titleText  = ` ${normalize(title)} `
  const kwInTitle  = kw ? titleText.indexOf(` ${kw} `) : -1
  const kwSlug     = toSlug(keyword)
  const density    = words ? (uses / words) * 100 : 0
  const longestParagraph = Math.max(0, ...paragraphs.map(wordCount))

  const basic: SeoCheck[] = [
    kwCheck('kw-title', 'Focus keyword in the SEO title', 10, kwInTitle !== -1,
      'The title contains it.',
      'Add it to the SEO title on the Google preview tab.'),
    kwCheck('kw-description', 'Focus keyword in the SEO description', 6, countPhrase(description, kw) > 0,
      'The description contains it.',
      'Add it to the description on the Google preview tab.'),
    kwCheck('kw-url', 'Focus keyword in the page address', 6, !!kwSlug && slug.includes(kwSlug),
      'The address contains it.',
      'The address is made from the homestay name, so this passes only when the name contains the keyword.'),
    kwCheck('kw-intro', 'Focus keyword at the start of the text', 8, countPhrase(openingText, kw) > 0,
      'It appears in the opening lines.',
      'Use it in the first lines of the page, e.g. the hero tagline or the start of the host story.'),
    kwCheck('kw-content', 'Focus keyword in the page text', 6, uses > 0,
      `Used ${uses} ${uses === 1 ? 'time' : 'times'}.`,
      'Use it in the host story or another section.'),
    {
      id: 'length', label: 'Length of the text', weight: 10,
      status: words >= 300 ? 'good' : words >= 150 ? 'ok' : 'bad',
      detail: `The page has ${words} ${words === 1 ? 'word' : 'words'}. ` + (words >= 300
        ? 'Enough for Google to understand the stay.'
        : 'Aim for at least 300: the host story, the food, the rooms and how to reach.'),
    },
  ]

  const additional: SeoCheck[] = [
    kwCheck('kw-heading', 'Focus keyword in a section heading', 6, headings.some(h => countPhrase(h, kw) > 0),
      'A section heading contains it.',
      'Use it in a section heading, e.g. the host story title.'),
    kw
      ? {
          id: 'density', label: 'How often the focus keyword is used', weight: 8,
          status: density > 2.5 ? 'bad' : density >= 0.5 ? 'good' : uses > 0 ? 'ok' : 'bad',
          detail: `${density.toFixed(1)}% (${uses} in ${words} words). ` + (
            density > 2.5  ? 'Too often: it reads as keyword stuffing, which Google can count against the page.'
            : density >= 0.5 ? 'About right (aim for around 1%).'
            : 'Aim for around 1%, written naturally.'),
        }
      : kwCheck('density', 'How often the focus keyword is used', 8, false, '', ''),
    {
      id: 'url-length', label: 'Short page address', weight: 3,
      status: slug && slug.length <= 60 ? 'good' : 'bad',
      detail: !slug ? 'Give the homestay a name: the address is made from it.'
        : slug.length <= 60 ? `benative.in/homestays/${slug}`
        : `The address is ${slug.length} characters: a shorter homestay name gives a shorter address.`,
    },
  ]

  const titleLen = title.trim().length
  const descLen  = description.trim().length
  const titleStatus = titleLengthStatus(titleLen)
  const descStatus  = descriptionLengthStatus(descLen)

  const titleAndDescription: SeoCheck[] = [
    kwCheck('kw-title-start', 'Focus keyword near the start of the title', 6,
      kwInTitle !== -1 && kwInTitle < titleText.length / 2,
      'It is in the first half of the title.',
      kwInTitle === -1 ? 'It is not in the title yet.' : 'Move it to the first half, where Google is less likely to cut it off.'),
    {
      id: 'title-length', label: 'SEO title length', weight: 8, status: titleStatus,
      detail: `${titleLen} characters. ` + (
        titleStatus === 'good' ? `Fits in Google's results (up to ${TITLE_MAX}).`
        : titleLen === 0 ? 'Add a title.'
        : titleLen < 30 ? 'Short: there is room for the place, e.g. "Name, Village · BeNative".'
        : titleLen <= 70 ? 'Google may cut off the end.'
        : `Google will cut it off: keep it under ${TITLE_MAX}.`),
    },
    {
      id: 'description-length', label: 'SEO description length', weight: 8, status: descStatus,
      detail: `${descLen} characters. ` + (
        descStatus === 'good' ? `Fits under the title in Google's results (120 to ${DESCRIPTION_MAX}).`
        : descLen < 120 ? 'Short: say what makes the stay special, in 120 to 160 characters.'
        : 'Google will cut off the end: keep it under 160.'),
    },
  ]

  const readability: SeoCheck[] = [
    {
      id: 'paragraphs', label: 'Short paragraphs', weight: 7,
      status: words === 0 ? 'bad' : longestParagraph <= 150 ? 'good' : 'bad',
      detail: words === 0 ? 'No text yet.'
        : longestParagraph <= 150 ? 'Every paragraph is easy to read on a phone.'
        : `A paragraph has ${longestParagraph} words: split it, long paragraphs are hard to read on a phone.`,
    },
    {
      id: 'photos', label: 'Photos', weight: 8,
      status: photos >= 5 ? 'good' : photos > 0 ? 'ok' : 'bad',
      detail: `${photos} ${photos === 1 ? 'photo' : 'photos'}. ` + (photos >= 5
        ? 'Photos show in Google Images and on shared links.'
        : 'Add at least 5 to the gallery: they show in Google Images and on shared links.'),
    },
  ]

  const groups: SeoGroup[] = [
    { name: 'Basic SEO',           checks: basic },
    { name: 'Additional',          checks: additional },
    { name: 'Title & description', checks: titleAndDescription },
    { name: 'Readability',         checks: readability },
  ]

  const score = Math.round(groups.flatMap(g => g.checks).reduce((sum, c) => sum + c.weight * SCORE[c.status], 0))
  return { score, groups }
}
