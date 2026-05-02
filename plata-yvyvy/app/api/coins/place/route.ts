import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PlaceSchema = z.object({
  lat: z.number().min(-27.5).max(-22), // Paraguay bounds
  lng: z.number().min(-62).max(-54),
  rarity: z.enum(['common', 'rare', 'legendary']).optional(),
  value: z.enum([50, 100, 500, 1000]).optional(),
  sponsored_by: z.string().optional(),
  event_tag: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para colocar monedas' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = PlaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { lat, lng, rarity = 'common', value, sponsored_by, event_tag } = parsed.data
  const admin = createAdminClient()

  // Get user profile to check permissions
  const { data: profile } = await admin
    .from('user_profile')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Check if user can place coins (Conquistador+ only)
  if (!['conquistador', 'leyenda'].includes(profile.plan)) {
    return NextResponse.json({ 
      error: 'Solo usuarios Conquistador y Leyenda pueden colocar monedas. ¡Mejorá tu plan!' 
    }, { status: 403 })
  }

  // Validate rarity based on plan
  if (rarity === 'legendary' && profile.plan !== 'leyenda') {
    return NextResponse.json({ error: 'Solo usuarios Leyenda pueden colocar monedas legendarias' }, { status: 403 })
  }

  // Determine value if not specified
  let finalValue = value
  if (!finalValue) {
    const valueRanges = {
      common: [50, 100],
      rare: [100, 500],
      legendary: [500, 1000]
    }
    const range = valueRanges[rarity]
    finalValue = range[Math.floor(Math.random() * range.length)] as 50 | 100 | 500 | 1000
  }

  try {
    // Insert new coin
    const { data: coin, error } = await admin
      .from('coins')
      .insert({
        lat,
        lng,
        value: finalValue,
        rarity,
        sponsored_by: sponsored_by || null,
        placed_by_user: user.id,
        event_tag: event_tag || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Coin placement error:', error)
      return NextResponse.json({ error: 'Error al colocar moneda' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      coin,
    })

  } catch (error) {
    console.error('Coin placement error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
