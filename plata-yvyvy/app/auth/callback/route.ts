import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/map'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  // Handle OAuth success
  if (code) {
    try {
      const supabase = createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      if (data.user) {
        console.log('Successfully authenticated user:', data.user.id)
        
        // Create user profile if it doesn't exist
        try {
          // Simple insert with ignore conflicts
          const { error: profileError } = await (supabase as any)
            .from('user_profile')
            .insert({
              id: data.user.id,
              plan: 'free',
              coins_collected_today: 0,
              streak_days: 0,
              radar_pings_today: 3,
              total_coins: 0,
              total_value: 0,
              level: 1,
            })
            .select()
            .single()

          if (profileError && !profileError.message?.includes('duplicate')) {
            console.error('Error creating user profile:', profileError)
          } else {
            console.log('User profile creation completed')
          }
        } catch (error) {
          console.error('Error in user profile creation:', error)
        }

        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  // No code or error provided
  console.log('No code or error in callback')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
