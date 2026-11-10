import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/site'

// Kept out of search results while the page only says "Coming Soon": remove `robots` (and add the
// page to app/sitemap.ts) when the first article is published
export const metadata: Metadata = {
  title: 'Blog · BeNative',
  robots: NO_INDEX,
}

export default function BlogPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold text-stone-900 mb-3">Blog</h1>
      <p className="text-stone-500 text-lg">Coming Soon...</p>
    </div>
  )
}
