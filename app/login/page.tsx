import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginForm from './LoginForm'
import { NO_INDEX } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Login · BeNative',
  robots: NO_INDEX,
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
