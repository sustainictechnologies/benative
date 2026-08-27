import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}
