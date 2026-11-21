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

export function autoSeoTitle(name: string): string {
  return `${name} · BeNative`
}

export function autoSeoDescription(village: string, district: string): string {
  return `Authentic homestay in ${village}, ${district}. Direct host contact via BeNative.`
}
