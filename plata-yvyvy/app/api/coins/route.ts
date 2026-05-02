import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const { lat, lng } = parsed.data
  const supabase = createClient()

  // Get active coins within ~1km bounding box
  const latDelta = 0.009 // ~1km
  const lngDelta = 0.012

  const { data: coins, error } = await supabase
    .from('coins')
    .select('*')
    .eq('collected', false)
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If fewer than 5 coins visible, spawn new ones
  if ((coins?.length ?? 0) < 5) {
    const admin = createAdminClient()
    const newCoins = generateRandomCoins(lat, lng, 8)
    await admin.from('coins').insert(newCoins)

    const { data: refreshed } = await supabase
      .from('coins')
      .select('*')
      .eq('collected', false)
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .limit(50)

    return NextResponse.json({ coins: refreshed ?? [] })
  }

  return NextResponse.json({ coins: coins ?? [] })
}

function generateRandomCoins(lat: number, lng: number, count: number) {
  const coins = []
  const rarities = ['common', 'common', 'common', 'common', 'common', 'rare', 'rare', 'legendary']
  const values = { common: [50, 100], rare: [100, 500], legendary: [500, 1000] }

  for (let i = 0; i < count; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)]
    const valueOptions = values[rarity as keyof typeof values]
    const value = valueOptions[Math.floor(Math.random() * valueOptions.length)]

    // Random position within ~500m
    const coinLat = lat + (Math.random() - 0.5) * 0.0045
    const coinLng = lng + (Math.random() - 0.5) * 0.006

    coins.push({
      lat: coinLat,
      lng: coinLng,
      value,
      rarity,
      sponsored_by: Math.random() < 0.1 ? 'Empresa Local' : null, // 10% chance of being sponsored
    })
  }

  return coins
}
