import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateCoinsAround } from '@/lib/game/coinGenerator'
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

  // Get active (non-collected, non-expired) coins within ~1km bounding box
  const latDelta = 0.009 // ~1km
  const lngDelta = 0.012

  const { data: coins, error } = await supabase
    .from('coins')
    .select('*')
    .eq('is_collected', false)
    .gt('expires_at', new Date().toISOString())
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If fewer than 5 coins visible, spawn new ones
  if ((coins?.length ?? 0) < 5) {
    const admin = createAdminClient()
    const newCoins = generateCoinsAround(lat, lng, 8)
    await admin.from('coins').insert(newCoins)

    const { data: refreshed } = await supabase
      .from('coins')
      .select('*')
      .eq('is_collected', false)
      .gt('expires_at', new Date().toISOString())
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .limit(50)

    return NextResponse.json({ coins: refreshed ?? [] })
  }

  return NextResponse.json({ coins: coins ?? [] })
}
