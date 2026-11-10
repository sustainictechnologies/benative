import type { Metadata } from 'next'

// The public address of the site: used for canonical links, the sitemap and robots.txt
export const SITE_URL  = 'https://www.benative.in'
export const SITE_NAME = 'BeNative'

// The photo on a shared link's preview card when the page has none of its own.
// A full address: share cards are read by other sites, which cannot follow a path.
const DEFAULT_SHARE_IMAGE = `${SITE_URL}/hero.jpg`

interface PageSeo {
  title: string
  description: string
  /** The page's own address, from the site root: '/about' */
  path: string
  image?: { url: string; alt: string }
}

// Title, description, canonical link and share-card details of a public page.
// Each page sets its own: a page without them would inherit the homepage's share card.
export function pageMetadata({ title, description, path, image }: PageSeo): Metadata {
  const shareImage = image ?? { url: DEFAULT_SHARE_IMAGE, alt: 'BeNative: homestays across India' }
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [shareImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage.url],
    },
  }
}

// For pages that need an account or are not ready yet: kept out of search results
export const NO_INDEX: Metadata['robots'] = { index: false, follow: false }
