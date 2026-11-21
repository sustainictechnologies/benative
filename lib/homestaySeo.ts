// A homestay page's SEO settings (the builder's SEO panel) and the automatic title and description a page
// uses without them. Shared by the homestay page and the builder, so the panel's Google preview shows
// what the page really sends.

export interface HomestaySeo {
  /** The title in Google's results and the browser tab; '' = automatic */
  title:       string
  /** The text under the title in Google's results; '' = automatic */
  description: string
  /** The search phrase the page is written for. Only the SEO panel's checks use it: it is never on the page */
  keyword:     string
}

export const EMPTY_SEO: HomestaySeo = { title: '', description: '', keyword: '' }

export function hasSeo(seo: HomestaySeo | null | undefined): boolean {
  return !!seo && !!(seo.title.trim() || seo.description.trim() || seo.keyword.trim())
}

// "Village, District" — once only when both are the same. The state is not among the public
// fields of a homestay (it is only inside the private address), so it is not shown here.
export function joinPlace(village: string | null | undefined, district: string | null | undefined): string {
  const v = (village ?? '').trim()
  const d = (district ?? '').trim()
  return [v, d.toLowerCase() === v.toLowerCase() ? '' : d].filter(Boolean).join(', ')
}

export function autoSeoTitle(name: string, place: string): string {
  return place ? `${name}, ${place} · BeNative` : `${name} · BeNative`
}

// The opening of the host's story, from its first full sentence: its first lines can be just the hosts' names
// ("Rushabh and Omkar"). Nothing when the story is missing.
function storyOpening(storyText: string): string {
  const paragraphs = storyText.split('\n').map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const start = paragraphs.findIndex(p => p.length >= 40)
  return start < 0 ? '' : paragraphs.slice(start).join(' ')
}

// About as long as Google shows under a result; cut at a word, with "…"
const DESCRIPTION_LENGTH = 155
function shorten(text: string): string {
  if (text.length <= DESCRIPTION_LENGTH) return text
  const at = text.lastIndexOf(' ', DESCRIPTION_LENGTH - 1)
  return text.slice(0, at > 80 ? at : DESCRIPTION_LENGTH - 1).replace(/[\s,;:.—–-]+$/, '') + '…'
}

// Google's text under the result (and the share card's): the name and place, then the host's own story
// (storyText: '' when the story is hidden or missing)
export function autoSeoDescription(name: string, place: string, storyText: string): string {
  const opening = storyOpening(storyText)
  return opening
    ? shorten(`${name}${place ? ` in ${place}` : ''}. ${opening}`)
    : `${name} is a homestay in ${place || 'India'}. See photos, rooms, food and local experiences, and connect directly with the host through BeNative.`
}
