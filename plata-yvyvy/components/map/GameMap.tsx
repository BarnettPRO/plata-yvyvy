'use client'
import { useEffect, useRef } from 'react'
import { CoinRow } from '@/types/database.types'
import { COIN_CONFIGS } from '@/types/database.types'
import { haversineDistance, COLLECT_RADIUS_METERS } from '@/lib/geo/distance'

// Add CSS for treasure animations
const treasureStyles = `
  @keyframes flicker {
    0%, 100% { opacity: 0.6; transform: scale(0.95); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 1; }
  }
  
  @keyframes ghostDogFloat {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    25% { transform: translateY(-8px) rotate(1deg); }
    50% { transform: translateY(-4px) rotate(-1deg); }
    75% { transform: translateY(-12px) rotate(2deg); }
  }
  
  @keyframes ghostDogPulse {
    0%, 100% { 
      opacity: 0.7; 
      filter: drop-shadow(0 0 12px rgba(255,255,255,0.9)) brightness(1.2);
      transform: scale(1);
    }
    50% { 
      opacity: 1; 
      filter: drop-shadow(0 0 20px rgba(255,255,255,1)) brightness(1.5);
      transform: scale(1.1);
    }
  }
  
  @keyframes ghostPulse {
    0%, 100% { 
      opacity: 0.6; 
      transform: scale(1); 
      box-shadow: 0 0 40px rgba(255,255,255,0.6);
    }
    50% { 
      opacity: 1; 
      transform: scale(1.3); 
      box-shadow: 0 0 60px rgba(255,255,255,0.8);
    }
  }
  
  .treasure-wisp {
    animation: flicker 2s infinite alternate;
  }
  
  .coin-popup {
    backdrop-filter: blur(10px);
    background: rgba(0, 0, 0, 0.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
  }
`

interface GameMapProps {
  userLat: number
  userLng: number
  coins: CoinRow[]
  onCollect: (coinId: string, lat: number, lng: number) => void
  placementMode?: boolean
  canPlaceCoins?: boolean
}

export default function GameMap({ 
  userLat, 
  userLng, 
  coins, 
  onCollect, 
  placementMode = false,
  canPlaceCoins = false 
}: GameMapProps) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const playerRef = useRef<any>(null)
  const radiusRef = useRef<any>(null)

  // Inject CSS styles for treasure animations
  useEffect(() => {
    const styleId = 'treasure-animation-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = treasureStyles
      document.head.appendChild(style)
    }
  }, [])

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      // Clear any existing map instance
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(containerRef.current!, {
        center: [userLat, userLng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Player marker
      const playerIcon = L.divIcon({
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:#4ade80;border:3px solid white;
          box-shadow:0 0 12px rgba(74,222,128,0.8);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: '',
      })

      playerRef.current = L.marker([userLat, userLng], { icon: playerIcon }).addTo(map)

      // Collection radius circle
      radiusRef.current = L.circle([userLat, userLng], {
        radius: COLLECT_RADIUS_METERS,
        color: '#4ade80',
        fillColor: '#4ade80',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: '4 4',
      }).addTo(map)

      mapRef.current = map

      // Handle map clicks for coin placement
      if (canPlaceCoins) {
        map.on('click', async (e: any) => {
          if (placementMode) {
            const { lat, lng } = e.latlng
            await handlePlaceCoin(lat, lng)
          }
        })
      }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update player position
  useEffect(() => {
    if (!mapRef.current || !playerRef.current) return
    playerRef.current.setLatLng([userLat, userLng])
    radiusRef.current?.setLatLng([userLat, userLng])
    mapRef.current.panTo([userLat, userLng], { animate: true, duration: 0.5 })
  }, [userLat, userLng])

  // Sync coin markers
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current
      const currentIds = new Set(coins.map(c => c.id))
      const existingIds = new Set(markersRef.current.keys())

      // Remove stale markers
      for (const id of existingIds) {
        if (!currentIds.has(id)) {
          markersRef.current.get(id)?.remove()
          markersRef.current.delete(id)
        }
      }

      // Add new markers
      for (const coin of coins) {
        if (markersRef.current.has(coin.id)) continue

        const config = COIN_CONFIGS[coin.rarity]
        const dist = haversineDistance(userLat, userLng, coin.lat, coin.lng)
        const inRange = dist <= COLLECT_RADIUS_METERS

        // Check if it's nighttime (6pm - 6am) for brighter glow
        const hour = new Date().getHours()
        const isNight = hour >= 18 || hour < 6
        const glowIntensity = isNight ? 'FF' : 'AA'
        const glowSize = isNight ? '24px' : '18px'

        // Special effect for ₲50,000,000 legendary treasures - headless white dog
        const isLegendary = coin.value === 50000000
        const iconSize = isLegendary ? 48 : 36
        const iconAnchor = isLegendary ? 24 : 18

        const icon = L.divIcon({
          html: `<div class="treasure-wisp" style="
            width:${iconSize}px;height:${iconSize}px;font-size:20px;
            display:flex;align-items:center;justify-content:center;
            animation: ${isLegendary ? 'ghostDogFloat 3s infinite ease-in-out' : 'flicker 2s infinite alternate'};
            position:relative;
          ">
            ${isLegendary ? `
              <!-- Headless white dog spirit -->
              <div style="
                position:absolute;
                width:100%;
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:1;
              ">
                <div style="
                  font-size:28px;
                  animation: ghostDogPulse 2s infinite alternate;
                  filter: drop-shadow(0 0 12px rgba(255,255,255,0.9));
                  opacity: 0.9;
                ">🐕‍🔥</div>
              </div>
              <!-- Ethereal glow -->
              <div style="
                width:40px;height:40px;
                background:radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 40%, transparent 70%);
                border-radius:50%;
                position:absolute;
                animation: ghostPulse 2s infinite ease-in-out;
                box-shadow:0 0 40px rgba(255,255,255,0.6);
              "></div>
              <!-- Treasure glow underneath -->
              <div style="
                width:${glowSize};height:${glowSize};
                background:radial-gradient(circle, ${config.color}${glowIntensity} 0%, ${config.color}40 40%, transparent 70%);
                border-radius:50%;
                position:absolute;
                animation: pulse 1.5s infinite ease-in-out;
                box-shadow:0 0 ${isNight ? '40px' : '30px'} ${config.color}${glowIntensity};
              "></div>
              <!-- Central treasure -->
              <div style="
                width:16px;height:16px;
                background:${config.color};
                border-radius:50%;
                position:relative;z-index:2;
                box-shadow:0 0 12px ${config.color};
              "></div>
            ` : `
              <!-- Normal treasure -->
              <div style="
                width:${glowSize};height:${glowSize};
                background:radial-gradient(circle, ${config.color}${glowIntensity} 0%, ${config.color}40 40%, transparent 70%);
                border-radius:50%;
                position:absolute;
                animation: pulse 1.5s infinite ease-in-out;
                box-shadow:0 0 ${isNight ? '30px' : '20px'} ${config.color}${glowIntensity};
              "></div>
              <div style="
                width:12px;height:12px;
                background:${config.color};
                border-radius:50%;
                position:relative;z-index:2;
                box-shadow:0 0 8px ${config.color};
              "></div>
            `}
            ${coin.sponsored_by ? '<div style="position:absolute;top:-4px;right:-4px;font-size:10px;">🏢</div>' : ''}
          </div>`,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconAnchor, iconAnchor],
          className: '',
        })

        const popupContent = `
          <div style="font-family:sans-serif;padding:8px;text-align:center;min-width:180px">
            <div style="font-size:24px;margin-bottom:4px">${isLegendary ? '🐕‍🔥' : config.emoji}</div>
            <div style="font-weight:600;color:${config.color};margin-bottom:2px">
              ${config.name}
            </div>
            <div style="font-size:16px;color:#FFD700;margin-bottom:2px;font-weight:500">
              ₲${coin.value.toLocaleString()}
            </div>
            ${isLegendary && '<div style="font-size:12px;color:#FFD700;margin-bottom:4px">🐕‍🔥 ¡El Perro Blanco te guía!</div>'}
            <div style="font-size:11px;color:#888;margin-bottom:4px;font-style:italic">
              ${config.narrative}
            </div>
            <div style="font-size:12px;color:#888;margin-bottom:4px">${Math.round(dist)}m de distancia</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px;text-transform:capitalize">
              ${isLegendary ? 'Fuego fatuo legendario' : `Fuego fatuo ${coin.rarity}`}
            </div>
            ${coin.sponsored_by ? `<div style="font-size:11px;color:#FFD700;margin-bottom:8px">🏢 ${coin.sponsored_by}</div>` : ''}
            ${inRange
              ? `<button onclick="window._collectCoin('${coin.id}')"
                   style="padding:6px 16px;background:${isLegendary ? '#FFD700' : config.color};
                          border:none;border-radius:8px;cursor:pointer;
                          font-weight:600;color:white;width:100%">
                   🗜️ ¡Desenterrar!
                 </button>`
              : `<div style="font-size:12px;color:#888">Acercate más para desenterrar</div>`
            }
          </div>
        `

        const marker = L.marker([coin.lat, coin.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent, { className: 'coin-popup' })

        markersRef.current.set(coin.id, marker)
      }
    })
  }, [coins, userLat, userLng])

  // Bridge for popup button → React handler
  useEffect(() => {
    (window as any)._collectCoin = (coinId: string) => {
      onCollect(coinId, userLat, userLng)
    }
  }, [onCollect, userLat, userLng])

  const handlePlaceCoin = async (lat: number, lng: number) => {
    try {
      const response = await fetch('/api/coins/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      })

      if (response.ok) {
        // Coin placed successfully, the map will refresh automatically
        console.log('Coin placed successfully')
      } else {
        const error = await response.json()
        console.error('Error placing coin:', error.error)
      }
    } catch (error) {
      console.error('Network error placing coin:', error)
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
  )}
