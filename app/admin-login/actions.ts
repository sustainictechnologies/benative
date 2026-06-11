'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function adminLogin(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const validUser = process.env.ADMIN_USERNAME ?? 'admin'
  const validPass = process.env.ADMIN_PASSWORD ?? 'changeme'
  const secret    = process.env.ADMIN_SECRET   ?? 'admin_secret_token'

  if (username === validUser && password === validPass) {
    // Session cookie — no maxAge/expires means it dies when the browser closes
    cookies().set('admin_auth', secret, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
    })
    redirect('/admin')
  }

  return { error: 'Invalid username or password.' }
}

export async function adminLogout() {
  cookies().delete('admin_auth')
  redirect('/admin-login')
}
