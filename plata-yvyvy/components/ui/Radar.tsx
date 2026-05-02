'use client'
import { useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useCoins } from '@/hooks/useCoins'
import { haversineDistance } from '@/lib/geo/distance'

interface RadarProps {
  userLat: number
  userLng: number
  onPingUsed?: () => void
}

export default function Radar({ userLat, userLng, onPingUsed }: RadarProps) {
  const { profile } = useUserProfile()
  const { coins } = useCoins(userLat, userLng)
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<{
    direction: string
    distance: number
    coinCount: number
  } | null>(null)

  const canUseRadar = profile?.plan !== 'free' || (profile.radar_pings_today ?? 0) > 0

  const handleRadarPing = async () => {
    if (!canUseRadar || pinging) return

    setPinging(true)
    setPingResult(null)

    // Simulate radar scanning
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Find nearest coins within 2km
    const nearbyCoins = coins
      .map(coin => ({
        ...coin,
        distance: haversineDistance(userLat, userLng, coin.lat, coin.lng)
      }))
      .filter(coin => coin.distance <= 2000) // 2km radius
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3) // Top 3 nearest

    if (nearbyCoins.length > 0) {
      const nearest = nearbyCoins[0]
      const direction = getDirection(userLat, userLng, nearest.lat, nearest.lng)
      
      setPingResult({
        direction,
        distance: Math.round(nearest.distance),
        coinCount: nearbyCoins.length
      })
    } else {
      setPingResult({
        direction: 'ninguna',
        distance: 0,
        coinCount: 0
      })
    }

    setPinging(false)
    onPingUsed?.()
  }

  const getDirection = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    const dLng = (lng2 - lng1) * Math.PI / 180
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI
    bearing = (bearing + 360) % 360
    
    if (bearing >= 337.5 || bearing < 22.5) return 'Norte'
    if (bearing >= 22.5 && bearing < 67.5) return 'Noreste'
    if (bearing >= 67.5 && bearing < 112.5) return 'Este'
    if (bearing >= 112.5 && bearing < 157.5) return 'Sureste'
    if (bearing >= 157.5 && bearing < 202.5) return 'Sur'
    if (bearing >= 202.5 && bearing < 247.5) return 'Suroeste'
    if (bearing >= 247.5 && bearing < 292.5) return 'Oeste'
    return 'Noroeste'
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          📍 Radar
        </h3>
        {profile?.plan === 'free' && (
          <span className="text-blue-400 text-sm">
            {profile.radar_pings_today ?? 3} restantes
          </span>
        )}
      </div>

      <button
        onClick={handleRadarPing}
        disabled={!canUseRadar || pinging}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
          pinging
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
            : canUseRadar
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {pinging ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Escaneando...
          </span>
        ) : !canUseRadar ? (
          'Sin rastreos disponibles'
        ) : (
          '🔡 Activar Radar'
        )}
      </button>

      {pingResult && (
        <div className="mt-3 p-3 bg-black/30 rounded-lg">
          {pingResult.coinCount > 0 ? (
            <div>
              <div className="text-green-400 text-sm font-medium mb-1">
                🎯 {pingResult.coinCount} moneda{pingResult.coinCount > 1 ? 's' : ''} detectada{pingResult.coinCount > 1 ? 's' : ''}
              </div>
              <div className="text-white text-xs">
                La más cercana: {pingResult.direction} a {pingResult.distance}m
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              No hay monedas cerca (2km)
            </div>
          )}
        </div>
      )}

      {profile?.plan === 'free' && (
        <div className="mt-3 text-xs text-white/50">
          <p>Usuarios gratis tienen 3 rastreos por día</p>
          <p>Usuarios premium tienen radar ilimitado</p>
        </div>
      )}
    </div>
  )
}
