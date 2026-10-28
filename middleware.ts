import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// How long a page waits for Supabase to confirm who is signed in before opening anyway
const SESSION_CHECK_LIMIT_MS = 3000

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin routes with separate admin cookie auth. Admin pages do not use the Supabase
  // sign-in, so they skip the session check below.
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    const adminAuth   = request.cookies.get('admin_auth')?.value
    const adminSecret = process.env.ADMIN_SECRET   // no default: without it the admin pages stay locked
    if (!adminSecret || adminAuth !== adminSecret) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin-login'
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // No session check for Meta's WhatsApp messages, or for pages Next.js loads in the background
  // ahead of a click: the real visit checks the session when it happens
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch' ||
    (request.headers.get('sec-purpose') ?? '').includes('prefetch')
  if (pathname.startsWith('/api/whatsapp') || isPrefetch) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session token so it doesn't expire during the user's visit. If Supabase is slow,
  // the page opens anyway after a few seconds instead of timing out; the page checks the session itself.
  await Promise.race([
    supabase.auth.getUser().catch(() => null),
    new Promise((resolve) => setTimeout(resolve, SESSION_CHECK_LIMIT_MS)),
  ])

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
