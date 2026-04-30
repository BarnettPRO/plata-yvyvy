import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { haversineDistance, COLLECT_RADIUS_METERS } from '@/lib/geo/distance'
import { levelFromXP } from '@/lib/game/coinGenerator'
import { z } from 'zod'

const CollectSchema = z.object({
  coinId:  z.string().uuid(),
  userLat: z.number(),
  userLng: z.number(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CollectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { coinId, userLat, userLng } = parsed.data
  const admin = createAdminClient()

  // Fetch coin
  const { data: coin } = await admin
    .from('coins')
    .select('*')
    .eq('id', coinId)
    .single()

  if (!coin) return NextResponse.json({ error: 'Coin not found' }, { status: 404 })
  if (coin.is_collected) return NextResponse.json({ error: 'Already collected' }, { status: 409 })
  if (new Date(coin.expires_at) < new Date()) return NextResponse.json({ error: 'Coin expired' }, { status: 410 })

  // Validate proximity
  const distance = haversineDistance(userLat, userLng, coin.lat, coin.lng)
  if (distance > COLLECT_RADIUS_METERS) {
    return NextResponse.json({ error: 'Too far away', distance }, { status: 403 })
  }

  // Record collection first (atomic operation)
  const { error: collectionError } = await admin.from('collections').insert({
    user_id:     user.id,
    coin_id:     coinId,
    xp_gained:   coin.xp_value,
    user_lat:    userLat,
    user_lng:    userLng,
  })

  if (collectionError) {
    return NextResponse.json({ error: 'Failed to record collection' }, { status: 500 })
  }

  // Mark coin collected
  const { error: updateError } = await admin.from('coins').update({ is_collected: true }).eq('id', coinId)
  
  if (updateError) {
    // Rollback collection if coin update fails
    await admin.from('collections').delete().eq('user_id', user.id).eq('coin_id', coinId)
    return NextResponse.json({ error: 'Failed to update coin' }, { status: 500 })
  }

  // Update user XP
  const { data: userData } = await admin
    .from('users')
    .select('total_xp')
    .eq('id', user.id)
    .single()

  const newXP    = (userData?.total_xp ?? 0) + coin.xp_value
  const newLevel = levelFromXP(newXP)

  await admin
    .from('users')
    .update({ total_xp: newXP, level: newLevel })
    .eq('id', user.id)

  return NextResponse.json({
    success:  true,
    xpGained: coin.xp_value,
    newXP,
    newLevel,
    coinType: coin.type,
  })
}
