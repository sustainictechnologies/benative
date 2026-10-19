'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    // A signed-in visitor's visit carries their account, so Admin → Analytics can show who opened which page
    supabase.auth.getSession().then(({ data: { session } }) =>
      supabase.from('page_views').insert({
        path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        ...(session ? { user_id: session.user.id } : {}),
      })
    ).then(({ error }) => {
      if (error) console.error('[PageViewTracker] insert error:', error)
    })
  }, [pathname])

  return null
}
