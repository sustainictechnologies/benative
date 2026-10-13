import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Where Google (through Supabase) sends a visitor back after they sign in
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Only ever return to a page on this site
  const requested = searchParams.get('next') ?? '/'
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'

  // A failed sign-in is reported in the address itself
  let failure = searchParams.get('error_description') ?? searchParams.get('error')

  if (!failure && !code) failure = 'No sign-in code was returned'

  if (!failure && code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) failure = error.message
  }

  if (failure) {
    console.error('[auth/callback] sign-in failed:', failure)
    return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}&error=signin`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
