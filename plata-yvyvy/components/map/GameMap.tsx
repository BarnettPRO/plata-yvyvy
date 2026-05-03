'use client'
import { useEffect, useRef } from 'react'
import { CoinRow } from '@/types/database.types'
import { COIN_CONFIGS } from '@/types/database.types'
import { haversineDistance, COLLECT_RADIUS_METERS } from '@/lib/geo/distance'

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

        const icon = L.divIcon({
          html: `<div class="coin-marker" style="
            width:36px;height:36px;font-size:22px;
            border:2px solid ${config.color}33;
            background:${config.color}18;
            ${inRange ? `box-shadow:0 0 16px ${config.color}80;` : ''}
            ${coin.sponsored_by ? 'border-color: #FFD700;' : ''}
          ">${config.emoji}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: '',
        })

        const popupContent = `
          <div style="font-family:sans-serif;padding:8px;text-align:center;min-width:150px">
            <div style="font-size:24px;margin-bottom:4px">${config.emoji}</div>
            <div style="font-weight:600;color:${config.color};margin-bottom:2px">₲${coin.value}</div>
            <div style="font-size:12px;color:#888;margin-bottom:4px">${Math.round(dist)}m de distancia</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px;text-transform:capitalize">${coin.rarity}</div>
            ${coin.sponsored_by ? `<div style="font-size:11px;color:#FFD700;margin-bottom:8px">🏢 ${coin.sponsored_by}</div>` : ''}
            ${inRange
              ? `<button onclick="window._collectCoin('${coin.id}')"
                   style="padding:6px 16px;background:${config.color};
                          border:none;border-radius:8px;cursor:pointer;
                          font-weight:600;color:white;width:100%">
                   ¡Recolectar!
                 </button>`
              : `<div style="font-size:12px;color:#888">Acercate más</div>`
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
