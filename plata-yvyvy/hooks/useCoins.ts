'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CoinRow, CoinRarity, UserProfileRow } from '@/types/database.types'
import { useUserProfile } from './useUserProfile'

export function useCoins(lat: number | null, lng: number | null) {
  const [coins, setCoins] = useState<CoinRow[]>([])
  const [loading, setLoading] = useState(false)
  const { profile } = useUserProfile()
  const supabase = createClient()

  const fetchCoins = useCallback(async () => {
    if (!lat || !lng || !supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .eq('collected', false)
        .gte('lat', lat - 0.009) // ~1km bounding box
        .lte('lat', lat + 0.009)
        .gte('lng', lng - 0.012)
        .lte('lng', lng + 0.012)
        .limit(50)

      if (error) {
        console.error('Failed to fetch coins:', error)
        return
      }

      // Filter coins based on user's plan
      let filteredCoins = data || []
      if (profile) {
        filteredCoins = data.filter(coin => {
          if (coin.rarity === 'common') return true
          if (coin.rarity === 'rare') return ['explorador', 'conquistador', 'leyenda'].includes(profile.plan)
          if (coin.rarity === 'legendary') return ['conquistador', 'leyenda'].includes(profile.plan)
          return false
        })
      } else {
        // Non-authenticated users only see common coins
        filteredCoins = data.filter(coin => coin.rarity === 'common')
      }

      setCoins(filteredCoins)
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setLoading(false)
    }
  }, [lat, lng, profile])

  // Fetch on location change
  useEffect(() => {
    fetchCoins()
    const interval = setInterval(fetchCoins, 30_000)
    return () => clearInterval(interval)
  }, [fetchCoins])

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return
    
    const channel = supabase
      .channel('coins-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coins' },
        (payload) => {
          // Handle coin updates - remove collected coins
          if (payload.eventType === 'UPDATE' && payload.new.collected === true) {
            setCoins((prev: CoinRow[]) => prev.filter((c: CoinRow) => c.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    // cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const collectCoin = useCallback(async (coinId: string, userLat: number, userLng: number) => {
    if (!profile) {
      return { success: false, error: 'Debes iniciar sesión para recolectar monedas' }
    }

    // Check daily limit for free users
    if (profile.plan === 'free' && profile.coins_collected_today >= 10) {
      return { success: false, error: 'Llegaste al límite diario de 10 monedas. ¡Mejorá tu plan!' }
    }

    try {
      const res = await fetch('/api/coins/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coinId, userLat, userLng }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        return { success: false, error: errorData.error || res.statusText }
      }
      
      const data = await res.json()

      if (data.success) {
        setCoins((prev: CoinRow[]) => prev.filter((c: CoinRow) => c.id !== coinId))
      }

      return data
    } catch (error) {
      console.error('Error collecting coin:', error)
      return { success: false, error: 'Error de red' }
    }
  }, [profile])

  return { coins, loading, collectCoin, refresh: fetchCoins }
}
