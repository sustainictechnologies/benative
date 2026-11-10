import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'

// Rebuilt at most once an hour, so a newly launched homestay appears without a deploy
export const revalidate = 3600

// Public pages only. Left out: sign-in, profile, host dashboard, admin, previews, launch pages,
// and the Blog and Favourites pages while they only say "Coming Soon".
const STATIC_PAGES: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '/',               changeFrequency: 'daily',   priority: 1 },
  { path: '/discover',       changeFrequency: 'daily',   priority: 0.9 },
  { path: '/map',            changeFrequency: 'daily',   priority: 0.7 },
  { path: '/about',          changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq',            changeFrequency: 'monthly', priority: 0.6 },
  { path: '/list-your-stay', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/recommend',      changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact',        changeFrequency: 'monthly', priority: 0.4 },
  { path: '/donate',         changeFrequency: 'monthly', priority: 0.3 },
  { path: '/privacy',        changeFrequency: 'monthly', priority: 0.2 },
]

// Live homestays, read as a signed-out visitor: exactly what the public can open.
// Drafts (latitude 0) have no public page and are left out.
async function getHomestayEntries(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const entries: MetadataRoute.Sitemap = []
  const seen = new Set<string>()
  const PAGE_SIZE = 1000

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('homestays')
      .select('slug, created_at, updated_at')
      .neq('latitude', 0)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error || !data) break

    for (const h of data) {
      if (!h.slug || seen.has(h.slug)) continue
      seen.add(h.slug)
      const modified = h.updated_at ?? h.created_at
      entries.push({
        url: `${SITE_URL}/homestays/${encodeURIComponent(h.slug)}`,
        lastModified: modified ? new Date(modified) : undefined,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
    if (data.length < PAGE_SIZE) break
  }
  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If the database cannot be reached, the sitemap still lists the fixed pages
  const homestays = await getHomestayEntries().catch(() => [])

  return [
    ...STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
      url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
      changeFrequency,
      priority,
    })),
    ...homestays,
  ]
}
