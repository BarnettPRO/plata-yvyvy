'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfileRow } from '@/types/database.types'
import { xpForNextLevel } from '@/lib/game/coinGenerator'

export function usePlayer() {
  const [player, setPlayer]   = useState<UserProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          setLoading(false)
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching player:', error)
        } else if (data) {
          setPlayer(data)
        } else if (!isCreatingProfile) {
          // Profile doesn't exist, create it (but only once)
          setIsCreatingProfile(true)
          try {
            const { data: newProfile, error: insertError } = await (supabase as any)
              .from('user_profile')
              .upsert({
                id: user.id,
                coins_collected_today: 0,
                streak_days: 0,
                radar_pings_today: 0,
                total_coins: 0,
                total_value: 0,
                level: 1,
                achievements: [],
                is_admin: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' })
              .select()
              .single()

            if (insertError) {
              console.error('Error creating player profile:', insertError)
            } else {
              setPlayer(newProfile)
            }
          } catch (err) {
            console.error('Error in player profile creation:', err)
          } finally {
            setIsCreatingProfile(false)
          }
        }

        setLoading(false)

        // Listen for realtime updates to own profile
        const channel = supabase
          .channel('player-profile')
          .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'user_profile',
            filter: `id=eq.${user.id}`, // Only listen for current user updates
          }, (payload: any) => {
            setPlayer(payload.new as UserProfileRow)
          })
          .subscribe()

        return () => { supabase.removeChannel(channel) }
      } catch (error) {
        console.error('Error fetching player:', error)
        setLoading(false)
      }
    }

    fetchPlayer()
  }, [])

  const xpProgress = player
    ? {
        current:  player.total_value - getXPAtLevel(player.level),
        needed:   xpForNextLevel(player.level),
        percent:  Math.min(100, Math.round(
          ((player.total_value - getXPAtLevel(player.level)) / xpForNextLevel(player.level)) * 100
        )),
      }
    : null

  return { player, loading, xpProgress }
}

function getXPAtLevel(level: number): number {
  let xp = 0
  for (let i = 1; i < level; i++) xp += Math.floor(100 * Math.pow(1.5, i - 1))
  return xp
}
