export async function POST() {
  try {
    // Call the existing Edge Function using anon key
    const response = await fetch('https://anskelgrnddgcvcgxkcf.supabase.co/functions/v1/spawn-coins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` 
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error calling spawn-coins Edge Function:', errorData)
      return Response.json({ error: 'Failed to spawn coins' }, { status: response.status })
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error in spawn-coins API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
