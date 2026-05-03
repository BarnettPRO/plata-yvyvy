import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Count existing uncollected coins
  const { count } = await supabase
    .from('coins')
    .select('*', { count: 'exact', head: true })
    .eq('collected', false)

  const existing = count ?? 0
  const toSpawn = Math.max(0, 50 - existing)

  if (toSpawn === 0) {
    return new Response(JSON.stringify({ message: 'Enough coins exist', existing }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Generate new coins with rarity mapping
  const coinOptions = [
    { value: 50, rarity: 'common' },
    { value: 100, rarity: 'common' },
    { value: 500, rarity: 'rare' },
    { value: 1000, rarity: 'legendary' }
  ]
  const newCoins = Array.from({ length: toSpawn }, () => {
    const coin = coinOptions[Math.floor(Math.random() * coinOptions.length)]
    return {
      lat: -27.5 + Math.random() * 8.3,
      lng: -62.6 + Math.random() * 8.4,
      value: coin.value,
      rarity: coin.rarity,
      collected: false,
      last_spawned_at: new Date().toISOString()
    }
  })

  const { error } = await supabase.from('coins').insert(newCoins)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ message: `Spawned ${toSpawn} coins`, total: 50 }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
