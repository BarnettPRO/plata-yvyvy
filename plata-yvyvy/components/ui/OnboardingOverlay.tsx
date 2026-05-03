'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OnboardingOverlayProps {
  onComplete: () => void
  userLat: number
  userLng: number
}

export default function OnboardingOverlay({ onComplete, userLat, userLng }: OnboardingOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [textOpacity, setTextOpacity] = useState(0)
  const [showMap, setShowMap] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has already seen onboarding
    const checkOnboardingStatus = async () => {
      const supabase = createClient()
      if (!supabase) return
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profile')
          .select('has_seen_onboarding')
          .eq('id', user.id)
          .single()
        
        if (profile && 'has_seen_onboarding' in profile && profile.has_seen_onboarding) {
          setHasSeenOnboarding(true)
          onComplete()
          return
        }
      }
    }

    checkOnboardingStatus()
  }, [onComplete])

  useEffect(() => {
    if (hasSeenOnboarding) return

    // Start the 10-second sequence
    const sequence = async () => {
      // Fade in text (0-2 seconds)
      setTimeout(() => setTextOpacity(1), 100)

      // Hold text (2-6 seconds)
      setTimeout(() => {
        // Start fade out text and show map (6-8 seconds)
        setTextOpacity(0)
        setShowMap(true)
      }, 5000)

      // Complete onboarding (8-10 seconds)
      setTimeout(async () => {
        const supabase = createClient()
        if (!supabase) return
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          await supabase
            .from('user_profile')
            .update({ has_seen_onboarding: true })
            .eq('id', user.id)
        }

        setIsVisible(false)
        setTimeout(onComplete, 500)
      }, 8000)
    }

    sequence()
  }, [hasSeenOnboarding, onComplete])

  // Place a special coin near the user for first-time experience
  useEffect(() => {
    if (!showMap || hasSeenOnboarding) return

    const placeFirstTreasure = async () => {
      const supabase = createClient()
      if (!supabase) return
      
      // Calculate a position 200m away from user
      const angle = Math.random() * Math.PI * 2
      const distance = 200 // 200 meters
      const earthRadius = 6371000 // Earth's radius in meters
      
      const lat1 = userLat * Math.PI / 180
      const lng1 = userLng * Math.PI / 180
      
      const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / earthRadius) +
                   Math.cos(lat1) * Math.sin(distance / earthRadius) * Math.cos(angle))
      
      const lng2 = lng1 + Math.atan2(Math.sin(angle) * Math.sin(distance / earthRadius) * Math.cos(lat1),
                        Math.cos(distance / earthRadius) - Math.sin(lat1) * Math.sin(lat2))
      
      const treasureLat = lat2 * 180 / Math.PI
      const treasureLng = lng2 * 180 / Math.PI

      // Create a special onboarding treasure
      await supabase.from('coins').insert({
        lat: treasureLat,
        lng: treasureLng,
        value: 50000, // Special onboarding value
        rarity: 'common',
        is_collected: false,
        spawn_date: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
    }

    placeFirstTreasure()
  }, [showMap, userLat, userLng, hasSeenOnboarding])

  if (hasSeenOnboarding || !isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Story text overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-2000"
        style={{ opacity: textOpacity }}
      >
        <div className="text-center max-w-md">
          <div className="text-6xl mb-8 animate-pulse">✨</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4 leading-tight">
            Plata Yvyvy
          </h2>
          <p className="text-white text-lg leading-relaxed mb-6">
            Durante la Guerra Grande, miles de familias enterraron su fortuna para protegerla del enemigo.
          </p>
          <p className="text-white text-lg leading-relaxed mb-6">
            Esos tesoros nunca fueron recuperados. Siguen ahí, bajo las calles de Paraguay.
          </p>
          <p className="text-yellow-300 text-xl font-semibold leading-relaxed">
            Esta noche, el overava brilla sobre uno de ellos... cerca tuyo.
          </p>
        </div>
      </div>

      {/* Map preview with glowing treasure */}
      {showMap && (
        <div 
          className="absolute inset-0 transition-opacity duration-2000"
          style={{ opacity: 1 - textOpacity }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-block">
                {/* Simulated map with treasure glow */}
                <div className="w-64 h-64 bg-gray-800 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20"></div>
                  
                  {/* User position */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    <div className="text-white text-xs mt-1">Tú</div>
                  </div>
                  
                  {/* Glowing treasure */}
                  <div className="absolute top-1/3 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 w-12 h-12 bg-yellow-400/30 rounded-full animate-pulse"></div>
                      <div className="text-yellow-300 text-xs mt-2 font-semibold">200m</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-yellow-400 text-lg font-semibold mt-6 animate-pulse">
                ¡Tu primer tesoro te espera!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
