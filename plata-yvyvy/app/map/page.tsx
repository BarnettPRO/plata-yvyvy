'use client'
import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useCoins }       from '@/hooks/useCoins'
import { usePlayer }      from '@/hooks/usePlayer'
import XPBar              from '@/components/ui/XPBar'
import CoinPopup          from '@/components/ui/CoinPopup'
import BottomNav          from '@/components/layout/BottomNav'
import { CoinType }       from '@/types/database.types'

// Leaflet must be client-side only
const GameMap = dynamic(() => import('@/components/map/GameMap'), { ssr: false })

export default function MapPage() {
  const { lat, lng, error: geoError, loading: geoLoading } = useGeolocation()
  const { coins, collectCoin } = useCoins(lat, lng)
  const { player, xpProgress } = usePlayer()
  const [toast, setToast]      = useState<{ xp: number; type: CoinType; newLevel?: number } | null>(null)

  const handleCollect = useCallback(async (coinId: string, userLat: number, userLng: number) => {
    const result = await collectCoin(coinId, userLat, userLng)
    if (result.success) {
      setToast({
        xp:       result.xpGained,
        type:     result.coinType,
        newLevel: result.newLevel !== player?.level ? result.newLevel : undefined,
      })
    }
  }, [collectCoin, player?.level])

  if (geoLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0D1B0F]">
        <div className="text-4xl mb-4 animate-pulse">📡</div>
        <p className="text-white/60">Buscando tu ubicación...</p>
      </div>
    )
  }

  if (geoError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0D1B0F] px-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-display text-xl font-bold mb-2">{geoError}</h2>
        <p className="text-white/50 text-sm">
          Habilitá el GPS en la configuración de tu navegador para jugar.
        </p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D1B0F] overflow-hidden">
      {/* HUD top */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 pointer-events-none">
        {player && xpProgress && (
          <div className="pointer-events-auto">
            <XPBar
              username={player.username}
              level={player.level}
              current={xpProgress.current}
              needed={xpProgress.needed}
              percent={xpProgress.percent}
            />
          </div>
        )}

        {/* Coin count */}
        <div className="mt-2 flex gap-2">
          <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-sm">
            <span>💰</span>
            <span className="font-semibold text-yellow-400">{coins.length}</span>
            <span className="text-white/50">cercanas</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {lat && lng && (
          <GameMap
            userLat={lat}
            userLng={lng}
            coins={coins}
            onCollect={handleCollect}
          />
        )}
      </div>

      {/* Toast */}
      <CoinPopup toast={toast} onDismiss={() => setToast(null)} />

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}
