import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Public pages (homepage, Discover, homestay pages and the rest) stay open to search engines.
// Closed: admin, sign-in, account pages, hosts' private preview and launch links, and the API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',        // also covers /admin-login
          '/api/',
          '/auth/',
          '/login',
          '/profile',
          '/favorites',
          '/host/',
          '/preview/',
          '/launch/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
