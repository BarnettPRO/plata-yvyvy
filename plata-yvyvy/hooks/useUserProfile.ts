'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfileRow, PlanType } from '@/types/database.types'
import { getLocationFromCoordinates } from '@/lib/geolocation/locationService'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
      } else if (data) {
        setProfile(data)
      } else if (!isCreatingProfile) {
        // Profile doesn't exist, create it (but only once)
        setIsCreatingProfile(true)
        try {
          const { data: newProfile, error: insertError } = await (supabase as any)
            .from('user_profile')
            .upsert({
              id: user.id,
              plan: 'free',
              coins_collected_today: 0,
              streak_days: 0,
              radar_pings_today: 3,
              total_coins: 0,
              total_value: 0,
              level: 1,
              achievements: [],
              is_admin: false,
              city: null,
              barrio: null,
              referral_code: null,
              referred_by: null,
              last_collection_date: null,
              current_streak: 0,
              streak_multiplier: 1.0,
              streak_rescue_available: true,
              last_rescue_date: null,
              has_gold_crown: false,
              last_coin_spawn_seen: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
          } else {
            setProfile(newProfile)
          }
        } catch (err) {
          console.error('Error in profile creation:', err)
        } finally {
          setIsCreatingProfile(false)
        }
      }

      setLoading(false)
    }

    fetchProfile()

    if (!supabase) {
      setLoading(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Re-fetch profile when auth state changes
        if (session?.user) {
          fetchProfile()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, profile?.id])

  const updateProfile = async (updates: Partial<UserProfileRow>) => {
    if (!profile || !supabase) return

    const { error } = await (supabase as any)
      .from('user_profile')
      .update(updates)
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating profile:', error)
      return false
    }

    return true
  }

  const updateUserLocation = async (lat: number, lng: number) => {
    if (!profile || !supabase) return false

    try {
      const location = await getLocationFromCoordinates(lat, lng)
      
      const { error } = await supabase
        .from('user_profile')
        .update({
          city: location.city,
          barrio: location.barrio,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating location:', error)
        return false
      }

      // Update local profile state
      setProfile({
        ...profile,
        city: location.city,
        barrio: location.barrio
      })

      return true
    } catch (error) {
      console.error('Error in updateUserLocation:', error)
      return false
    }
  }

  return { profile, loading, updateProfile, updateUserLocation }
}
