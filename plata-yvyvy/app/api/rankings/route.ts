import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'city' // Default to city ranking
  const userId = searchParams.get('userId')

  const supabase = createAdminClient()
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    switch (type) {
      case 'national':
        return await getNationalRanking(supabase, userId)
      case 'city':
        return await getCityRanking(supabase, userId)
      case 'barrio':
        return await getBarrioRanking(supabase, userId)
      case 'friends':
        return await getFriendsRanking(supabase, userId)
      default:
        return NextResponse.json({ error: 'Invalid ranking type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Ranking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getNationalRanking(supabase: any, userId: string | null) {
  const { data, error } = await supabase
    .from('user_profile')
    .select('id, total_value, level, created_at')
    .order('total_value', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  // Add rank numbers and crown icons for top 3
  const rankings = data.map((player: any, index: number) => ({
    rank: index + 1,
    id: player.id,
    username: `Jugador ${player.id.slice(0, 8).toUpperCase()}`,
    level: player.level,
    total_value: player.total_value,
    isCurrentUser: player.id === userId,
    crown: index < 3 ? ['🥇', '🥈', '🥉'][index] : null
  }))

  return NextResponse.json({ rankings, type: 'national' })
}

async function getCityRanking(supabase: any, userId: string | null) {
  // Get current user's city first
  let userCity = null
  if (userId) {
    const { data: userData } = await supabase
      .from('user_profile')
      .select('city')
      .eq('id', userId)
      .single()
    userCity = userData?.city
  }

  if (!userCity || userCity === 'Otra Ciudad') {
    return NextResponse.json({
      rankings: [],
      type: 'city',
      message: 'Activá tu ubicación para ver tu ranking local',
      city: userCity
    })
  }

  const { data, error } = await supabase
    .from('user_profile')
    .select('id, total_value, level, city')
    .eq('city', userCity)
    .order('total_value', { ascending: false })
    .limit(20)

  if (error) {
    throw error
  }

  const rankings = data.map((player: any, index: number) => ({
    rank: index + 1,
    id: player.id,
    username: `Jugador ${player.id.slice(0, 8).toUpperCase()}`,
    level: player.level,
    total_value: player.total_value,
    isCurrentUser: player.id === userId
  }))

  return NextResponse.json({ rankings, type: 'city', city: userCity })
}

async function getBarrioRanking(supabase: any, userId: string | null) {
  // Get current user's barrio first
  let userBarrio = null
  let userCity = null
  if (userId) {
    const { data: userData } = await supabase
      .from('user_profile')
      .select('barrio, city')
      .eq('id', userId)
      .single()
    userBarrio = userData?.barrio
    userCity = userData?.city
  }

  if (!userBarrio || !userCity) {
    return NextResponse.json({
      rankings: [],
      type: 'barrio',
      message: 'Activá tu ubicación para ver tu ranking de barrio',
      barrio: userBarrio
    })
  }

  // Check if barrio has enough players (minimum 3)
  const { count, error: countError } = await supabase
    .from('user_profile')
    .select('*', { count: 'exact', head: true })
    .eq('barrio', userBarrio)

  if (countError) {
    throw countError
  }

  // If less than 3 players, fall back to city ranking
  if (count < 3) {
    return await getCityRanking(supabase, userId)
  }

  const { data, error } = await supabase
    .from('user_profile')
    .select('id, total_value, level, barrio')
    .eq('barrio', userBarrio)
    .order('total_value', { ascending: false })
    .limit(10)

  if (error) {
    throw error
  }

  const rankings = data.map((player: any, index: number) => ({
    rank: index + 1,
    id: player.id,
    username: `Jugador ${player.id.slice(0, 8).toUpperCase()}`,
    level: player.level,
    total_value: player.total_value,
    isCurrentUser: player.id === userId,
    isBarrioOwner: index === 0 && data.length >= 3 // Only #1 in barrios with 3+ players
  }))

  return NextResponse.json({ rankings, type: 'barrio', barrio: userBarrio })
}

async function getFriendsRanking(supabase: any, userId: string | null) {
  if (!userId) {
    return NextResponse.json({
      rankings: [],
      type: 'friends',
      message: 'Iniciá sesión para ver el ranking de amigos'
    })
  }

  // Get user's referral code and who referred them
  const { data: userData, error: userError } = await supabase
    .from('user_profile')
    .select('referral_code, referred_by')
    .eq('id', userId)
    .single()

  if (userError) {
    throw userError
  }

  // Build list of referral codes to search for
  const referralCodes = [userData.referral_code]
  if (userData.referred_by) {
    referralCodes.push(userData.referred_by)
  }

  // Get people who were referred by current user OR people who referred current user
  const { data, error } = await supabase
    .from('user_profile')
    .select('id, total_value, level, referral_code, referred_by')
    .or(`referred_by.eq.${userData.referral_code},referral_code.in.(${referralCodes.map(code => `'${code}'`).join(',')}),id.eq.${userId}`)
    .order('total_value', { ascending: false })

  if (error) {
    throw error
  }

  // If no friends found (only current user), return message
  if (data.length <= 1) {
    return NextResponse.json({
      rankings: [],
      type: 'friends',
      message: 'Invitá amigos con tu código para competir entre conocidos 👥',
      referralCode: userData.referral_code
    })
  }

  const rankings = data.map((player: any, index: number) => ({
    rank: index + 1,
    id: player.id,
    username: `Jugador ${player.id.slice(0, 8).toUpperCase()}`,
    level: player.level,
    total_value: player.total_value,
    isCurrentUser: player.id === userId,
    relationship: player.id === userId ? 'Tú' : 
                  player.referred_by === userData.referral_code ? 'Referido' : 
                  player.referral_code === userData.referred_by ? 'Referidor' : 'Mutuo'
  }))

  return NextResponse.json({ rankings, type: 'friends' })
}
