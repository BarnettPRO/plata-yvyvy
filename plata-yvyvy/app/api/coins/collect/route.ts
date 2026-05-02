import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { haversineDistance, COLLECT_RADIUS_METERS } from '@/lib/geo/distance'
import { z } from 'zod'
import { Database, UserProfileRow, CoinRow } from '@/types/database.types'

const CollectSchema = z.object({
  coinId: z.string().uuid(),
  userLat: z.number(),
  userLng: z.number(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para recolectar monedas' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CollectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { coinId, userLat, userLng } = parsed.data
  const admin = createAdminClient()

  // Get user profile to check limits
  const { data: profile } = await admin
    .from('user_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Check daily limit for free users
  if (profile.plan === 'free' && (profile.coins_collected_today ?? 0) >= 10) {
    return NextResponse.json({ error: 'Llegaste al límite diario de 10 monedas. ¡Mejorá tu plan!' }, { status: 429 })
  }

  // Fetch coin
  const { data: coin } = await admin
    .from('coins')
    .select('*')
    .eq('id', coinId)
    .single()

  if (!coin) return NextResponse.json({ error: 'Moneda no encontrada' }, { status: 404 })
  if (coin.collected) return NextResponse.json({ error: 'Ya fue recolectada' }, { status: 409 })

  // Validate proximity
  const distance = haversineDistance(userLat, userLng, coin.lat, coin.lng)
  if (distance > COLLECT_RADIUS_METERS) {
    return NextResponse.json({ error: 'Estás demasiado lejos', distance }, { status: 403 })
  }

  // Start transaction
  try {
    // Record collection
    const { error: collectionError } = await admin.from('collections').insert({
      user_id: user.id,
      coin_id: coinId,
      value: coin.value,
      rarity: coin.rarity,
      user_lat: userLat,
      user_lng: userLng,
    })

    if (collectionError) {
      return NextResponse.json({ error: 'Error al registrar colección' }, { status: 500 })
    }

    // Mark coin as collected
    const { error: updateError } = await admin
      .from('coins')
      .update({ 
        collected: true, 
        collected_by: user.id, 
        collected_at: new Date().toISOString() 
      })
      .eq('id', coinId)

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar moneda' }, { status: 500 })
    }

    // Update user profile
    const newTotalCoins = profile.total_coins + 1
    const newTotalValue = profile.total_value + coin.value
    const newCoinsToday = profile.coins_collected_today + 1

    await admin
      .from('user_profile')
      .update({
        total_coins: newTotalCoins,
        total_value: newTotalValue,
        coins_collected_today: newCoinsToday,
        level: Math.floor(newTotalValue / 1000) + 1, // Simple level calculation
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      value: coin.value,
      rarity: coin.rarity,
      sponsor: coin.sponsored_by,
      newTotalCoins,
      newTotalValue,
    })

  } catch (error) {
    console.error('Collection error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
