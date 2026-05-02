'use client'
import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useCoins } from '@/hooks/useCoins'
import { useUserProfile } from '@/hooks/useUserProfile'
import CoinPopup from '@/components/ui/CoinPopup'
import Radar from '@/components/ui/Radar'
import BottomNav from '@/components/layout/BottomNav'
import Link from 'next/link'
import { COIN_CONFIGS } from '@/types/database.types'

// Leaflet must be client-side only
const GameMap = dynamic(() => import('@/components/map/GameMap'), { ssr: false })

interface CollectToast {
  value: number
  rarity: string
  sponsor?: string
  error?: string
}

export default function MapPage() {
  const { lat, lng, error: geoError, loading: geoLoading } = useGeolocation()
  const { coins, collectCoin } = useCoins(lat, lng)
  const { profile } = useUserProfile()
  const [toast, setToast] = useState<CollectToast | null>(null)
  const [placementMode, setPlacementMode] = useState(false)

  const handleCollect = useCallback(async (coinId: string, userLat: number, userLng: number) => {
    const result = await collectCoin(coinId, userLat, userLng)
    
    if (result.success) {
      setToast({
        value: result.value,
        rarity: result.rarity,
        sponsor: result.sponsor,
      })
    } else {
      setToast({
        value: 0,
        rarity: '',
        error: result.error,
      })
    }
  }, [collectCoin])

  if (geoLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0d1a]">
        <div className="text-4xl mb-4 animate-pulse">📡</div>
        <p className="text-white/60">Buscando tu ubicación...</p>
      </div>
    )
  }

  if (geoError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0d1a] px-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2 text-white">{geoError}</h2>
        <p className="text-white/50 text-sm">
          Habilitá el GPS en la configuración de tu navegador para jugar.
        </p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0d1a] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-3">
        {/* User info and streak */}
        {profile && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg">
                  {profile.plan === 'leyenda' && '👑'}
                  {profile.plan === 'conquistador' && '⚔️'}
                  {profile.plan === 'explorador' && '🔍'}
                  {profile.plan === 'free' && '🆓'}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    Plan {profile.plan === 'free' ? 'Buscador' : profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
                  </div>
                  {profile.streak_days > 0 && (
                    <div className="text-orange-400 text-sm">
                      🔥 {profile.streak_days} días seguidos
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white/60 text-sm">
                  {profile.plan === 'free' 
                    ? `${profile.coins_collected_today}/10 monedas`
                    : 'Monedas ilimitadas'
                  }
                </div>
                {profile.plan === 'free' && (
                  <div className="text-blue-400 text-sm">
                    📍 {profile.radar_pings_today || 3} rastreos
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coin count */}
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
            <span>💰</span>
            <span className="font-semibold text-yellow-400">{coins.length}</span>
            <span className="text-white/60 text-sm">cercanas</span>
          </div>
          
          {profile && ['conquistador', 'leyenda'].includes(profile.plan) && (
            <button
              onClick={() => setPlacementMode(!placementMode)}
              className={`px-3 py-2 rounded-xl font-medium transition-colors ${
                placementMode
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {placementMode ? '📍 Colocando...' : '➕ Colocar'}
            </button>
          )}
        </div>

        {/* Radar for free users */}
        {profile?.plan === 'free' && (
          <div className="mt-2">
            <Radar 
              userLat={lat} 
              userLng={lng} 
              onPingUsed={() => {
                // This will trigger a profile refresh
                window.location.reload()
              }} 
            />
          </div>
        )}

        {/* Free user upgrade prompt */}
        {profile?.plan === 'free' && profile.coins_collected_today >= 8 && (
          <div className="mt-2 bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 rounded-xl p-2 border border-[#FFD700]/30">
            <div className="text-center">
              <p className="text-yellow-400 text-sm font-medium">
                ⚠️ Casi llegás al límite diario
              </p>
              <Link href="/pricing" className="text-white/80 text-xs underline">
                Mejorá tu plan →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {lat && lng && (
          <GameMap
            userLat={lat}
            userLng={lng}
            coins={coins}
            onCollect={handleCollect}
            placementMode={placementMode}
            canPlaceCoins={profile ? ['conquistador', 'leyenda'].includes(profile.plan) : false}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border ${
            toast.error 
              ? 'border-red-500/30' 
              : 'border-white/20'
          }`}>
            {toast.error ? (
              <div className="text-center">
                <div className="text-red-400 mb-1">❌</div>
                <p className="text-white text-sm">{toast.error}</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl mb-1">
                  {COIN_CONFIGS[toast.rarity as keyof typeof COIN_CONFIGS]?.emoji || '🪙'}
                </div>
                <p className="text-white font-semibold">
                  +₲{toast.value}
                </p>
                {toast.sponsor && (
                  <p className="text-yellow-400 text-xs">
                    Patrocinado por {toast.sponsor}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}
