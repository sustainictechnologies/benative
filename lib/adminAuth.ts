import { cookies } from 'next/headers'

// The same check middleware.ts makes for /admin pages. Server actions can be called
// directly, from any page, so every admin action runs this first.
export function assertAdmin() {
  const secret = process.env.ADMIN_SECRET ?? 'admin_secret_token'
  if (cookies().get('admin_auth')?.value !== secret) {
    throw new Error('Admin sign-in required.')
  }
}
