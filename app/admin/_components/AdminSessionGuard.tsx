'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSessionGuard() {
  const router = useRouter()

  useEffect(() => {
    // If sessionStorage flag is missing, this is a fresh load (new tab or reload) — log out
    const active = sessionStorage.getItem('admin_active')
    if (!active) {
      fetch('/api/admin-logout', { method: 'POST' }).finally(() => {
        router.replace('/admin-login')
      })
      return
    }
  }, [router])

  useEffect(() => {
    // Set flag for this session — cleared automatically on tab/browser close
    sessionStorage.setItem('admin_active', '1')
  }, [])

  return null
}
