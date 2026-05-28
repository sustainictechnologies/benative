import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Login · Be Native',
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
