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
      if (!res.ok) {
        console.error('Failed to fetch coins:', res.statusText)
        return
      }
      const data = await res.json()
      setCoins(data.coins ?? [])
    } catch (error) {
      console.error('Error fetching coins:', error)
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
      }, (payload: any) => {
        setCoins((prev: CoinRow[]) => prev.filter((c: CoinRow) => c.id !== payload.new.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const collectCoin = useCallback(async (coinId: string, userLat: number, userLng: number) => {
    try {
      const res  = await fetch('/api/coins/collect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coinId, userLat, userLng }),
      })
      
      if (!res.ok) {
        console.error('Failed to collect coin:', res.statusText)
        return { success: false, error: res.statusText }
      }
      
      const data = await res.json()

      if (data.success) {
        setCoins((prev: CoinRow[]) => prev.filter((c: CoinRow) => c.id !== coinId))
      }

      return data
    } catch (error) {
      console.error('Error collecting coin:', error)
      return { success: false, error: 'Network error' }
    }
  }, [])

  return { coins, loading, collectCoin, refresh: fetchCoins }
}
