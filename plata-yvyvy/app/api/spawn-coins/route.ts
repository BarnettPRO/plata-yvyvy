import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const values = [50, 50, 100, 100, 500, 1000]
    const rarities: Record<number, string> = { 50: 'common', 100: 'common', 500: 'rare', 1000: 'legendary' }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { count } = await supabase
      .from('coins')
      .select('*', { count: 'exact', head: true })
      .eq('collected', false)

    const toSpawn = Math.max(0, 50 - (count ?? 0))
    if (toSpawn === 0) return Response.json({ message: 'Enough coins exist', existing: count })

    // Generate new coins with rarity mapping
    const newCoins = Array.from({ length: toSpawn }, () => {
      const value = values[Math.floor(Math.random() * values.length)]
      return {
        lat: -27.5 + Math.random() * 8.3,
        lng: -62.6 + Math.random() * 8.4,
        value,
        rarity: rarities[value],
        collected: false,
        last_spawned_at: new Date().toISOString()
      }
    })

    const { error } = await supabase.from('coins').insert(newCoins)

    if (error) {
      console.error('Error spawning coins:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: `Spawned ${toSpawn} coins`, total: 50 })
  } catch (error) {
    console.error('Error in spawn-coins API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
