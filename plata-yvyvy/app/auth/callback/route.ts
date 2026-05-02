import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create user profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert({
          id: data.user.id,
        }, { 
          onConflict: 'id', 
          ignoreDuplicates: true 
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
