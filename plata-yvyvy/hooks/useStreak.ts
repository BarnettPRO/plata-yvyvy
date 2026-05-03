'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StreakData {
  current_streak: number
  streak_multiplier: number
  streak_rescue_available: boolean
  last_rescue_date: string | null
  has_gold_crown: boolean
  last_collection_date: string | null
  last_coin_spawn_seen: string | null
}

export function useStreak(userId: string | null) {
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStreak = async () => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/streak?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStreak(data.streak)
      }
    } catch (error) {
      console.error('Error fetching streak:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStreakOnCollect = async () => {
    if (!userId || !supabase) return false

    try {
      const response = await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'collect' })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchStreak() // Refresh streak data
        return data
      }
    } catch (error) {
      console.error('Error updating streak:', error)
    }
    return false
  }

  const rescueStreak = async () => {
    if (!userId || !supabase) return false

    try {
      const response = await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'rescue' })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchStreak() // Refresh streak data
        return data
      } else {
        const errorData = await response.json()
        return { error: errorData.error }
      }
    } catch (error) {
      console.error('Error rescuing streak:', error)
      return { error: 'Failed to rescue streak' }
    }
  }

  const markSpawnSeen = async () => {
    if (!userId || !supabase) return false

    try {
      await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'mark_spawn_seen' })
      })
      return true
    } catch (error) {
      console.error('Error marking spawn seen:', error)
      return false
    }
  }

  useEffect(() => {
    fetchStreak()
  }, [userId])

  return {
    streak,
    loading,
    updateStreakOnCollect,
    rescueStreak,
    markSpawnSeen,
    refreshStreak: fetchStreak
  }
}

// Hook for countdown timer to next respawn
export function useRespawnCountdown() {
  const [timeUntilRespawn, setTimeUntilRespawn] = useState<string>('')
  const [nextRespawnTime, setNextRespawnTime] = useState<Date | null>(null)

  useEffect(() => {
    const calculateTimeUntilRespawn = () => {
      const now = new Date()
      
      // Convert to Paraguay timezone (GMT-4)
      const paraguayTime = new Date(now.getTime() - (4 * 60 * 60 * 1000))
      
      // Get tomorrow's midnight in Paraguay time
      const tomorrow = new Date(paraguayTime)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      // Convert back to UTC
      const nextRespawnUTC = new Date(tomorrow.getTime() + (4 * 60 * 60 * 1000))
      setNextRespawnTime(nextRespawnUTC)
      
      // Calculate time difference
      const diff = nextRespawnUTC.getTime() - now.getTime()
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (hours > 0) {
          setTimeUntilRespawn(`${hours}h ${minutes}m`)
        } else {
          setTimeUntilRespawn(`${minutes}m`)
        }
      } else {
        setTimeUntilRespawn('Renaciendo...')
      }
    }

    calculateTimeUntilRespawn()
    const interval = setInterval(calculateTimeUntilRespawn, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return { timeUntilRespawn, nextRespawnTime }
}
