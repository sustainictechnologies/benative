'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('page_views').insert({
      path: pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    })
  }, [pathname])

  return null
}
