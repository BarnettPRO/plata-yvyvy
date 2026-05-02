'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfileRow, PlanType } from '@/types/database.types'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    fetchProfile()

    const { data: { subscription } } = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_profile',
        filter: `id=eq.${profile?.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setProfile(payload.new as UserProfileRow)
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [supabase, profile?.id])

  const updateProfile = async (updates: Partial<UserProfileRow>) => {
    if (!profile) return

    const { error } = await supabase
      .from('user_profile')
      .update(updates)
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating profile:', error)
      return false
    }

    return true
  }

  return { profile, loading, updateProfile }
}
