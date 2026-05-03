import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const supabase = createClient()
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from('user_profile')
      .select(`
        current_streak,
        streak_multiplier,
        streak_rescue_available,
        last_rescue_date,
        has_gold_crown,
        last_collection_date,
        last_coin_spawn_seen
      `)
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ streak: data })
  } catch (error) {
    console.error('Streak fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId, action } = await request.json()

  if (!userId || !action) {
    return NextResponse.json({ error: 'User ID and action required' }, { status: 400 })
  }

  const supabase = createClient()
  const adminSupabase = createAdminClient()
  
  if (!supabase || !adminSupabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    switch (action) {
      case 'collect':
        return await handleCoinCollection(adminSupabase, userId)
      case 'rescue':
        return await handleStreakRescue(adminSupabase, userId)
      case 'mark_spawn_seen':
        return await handleSpawnSeen(adminSupabase, userId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Streak action error:', error)
    return NextResponse.json({ error: 'Failed to perform streak action' }, { status: 500 })
  }
}

async function handleCoinCollection(supabase: any, userId: string) {
  // Update user streak
  const { error } = await supabase
    .rpc('update_user_streak', { user_id: userId, collection_date: new Date().toISOString().split('T')[0] })

  if (error) {
    throw error
  }

  // Get updated streak data
  const { data, error: fetchError } = await supabase
    .from('user_profile')
    .select('current_streak, streak_multiplier, has_gold_crown')
    .eq('id', userId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  return NextResponse.json({ 
    message: 'Streak updated',
    streak: {
      current: data.current_streak,
      multiplier: data.streak_multiplier,
      hasGoldCrown: data.has_gold_crown
    }
  })
}

async function handleStreakRescue(supabase: any, userId: string) {
  // Check if user has enough XP (500 XP cost)
  const { data: profile, error: profileError } = await supabase
    .from('user_profile')
    .select('total_value')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw profileError
  }

  if (profile.total_value < 500) {
    return NextResponse.json({ 
      error: 'Insufficient XP. Need 500 XP to rescue streak.' 
    }, { status: 400 })
  }

  // Use streak rescue
  const { data: success, error } = await supabase
    .rpc('use_streak_rescue', { user_id: userId })

  if (error) {
    throw error
  }

  if (!success) {
    return NextResponse.json({ 
      error: 'Streak rescue not available. You can only rescue a missed day once per week.' 
    }, { status: 400 })
  }

  // Deduct 500 XP
  const { error: deductError } = await supabase
    .from('user_profile')
    .update({ 
      total_value: profile.total_value - 500,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (deductError) {
    throw deductError
  }

  return NextResponse.json({ 
    message: 'Streak rescued successfully! -500 XP',
    streakRescued: true
  })
}

async function handleSpawnSeen(supabase: any, userId: string) {
  const { error } = await supabase
    .from('user_profile')
    .update({ 
      last_coin_spawn_seen: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    throw error
  }

  return NextResponse.json({ 
    message: 'Spawn notification marked as seen'
  })
}
