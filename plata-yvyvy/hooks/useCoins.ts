'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CoinRow } from '@/types/database.types'

export function useCoins(lat: number | null, lng: number | null) {
  const [coins, setCoins]       = useState<CoinRow[]>([])
  const [loading, setLoading]   = useState(false)
  const supabase                = createClient()

  const fetchCoins = useCallback(async () => {
    if (!lat || !lng) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/coins?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      setCoins(data.coins ?? [])
    } finally {
      setLoading(false)
    }
  }, [lat, lng])

  // Fetch on location change (throttled)
  useEffect(() => {
    fetchCoins()
    const interval = setInterval(fetchCoins, 30_000)
    return () => clearInterval(interval)
  }, [fetchCoins])

  // Realtime subscription — remove coin when collected by anyone
  useEffect(() => {
    const channel = supabase
      .channel('coins-realtime')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'coins',
        filter: 'is_collected=eq.true',
      }, payload => {
        setCoins(prev => prev.filter(c => c.id !== payload.new.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const collectCoin = useCallback(async (coinId: string, userLat: number, userLng: number) => {
    const res  = await fetch('/api/coins/collect', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ coinId, userLat, userLng }),
    })
    const data = await res.json()

    if (data.success) {
      setCoins(prev => prev.filter(c => c.id !== coinId))
    }

    return data
  }, [])

  return { coins, loading, collectCoin, refresh: fetchCoins }
}
