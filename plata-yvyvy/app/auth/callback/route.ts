import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/map'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert user profile
      const username = data.user.email?.split('@')[0] ?? `jugador_${Date.now()}`
      await supabase.from('users').upsert({
        id:            data.user.id,
        username,
        avatar_url:    data.user.user_metadata?.avatar_url ?? null,
        referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
