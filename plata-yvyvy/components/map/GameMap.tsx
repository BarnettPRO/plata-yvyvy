'use client'
import { useEffect, useRef } from 'react'
import { CoinRow } from '@/types/database.types'
import { COIN_COLOR, COIN_EMOJI } from '@/lib/game/coinGenerator'
import { haversineDistance, COLLECT_RADIUS_METERS } from '@/lib/geo/distance'

interface GameMapProps {
  userLat:     number
  userLng:     number
  coins:       CoinRow[]
  onCollect:   (coinId: string, lat: number, lng: number) => void
}

export default function GameMap({ userLat, userLng, coins, onCollect }: GameMapProps) {
  const mapRef       = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef   = useRef<Map<string, any>>(new Map())
  const playerRef    = useRef<any>(null)
  const radiusRef    = useRef<any>(null)

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      const map = L.map(containerRef.current!, {
        center:       [userLat, userLng],
        zoom:         17,
        zoomControl:  true,
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
        iconSize:   [20, 20],
        iconAnchor: [10, 10],
        className:  '',
      })

      playerRef.current = L.marker([userLat, userLng], { icon: playerIcon }).addTo(map)

      // Collection radius circle
      radiusRef.current = L.circle([userLat, userLng], {
        radius:      COLLECT_RADIUS_METERS,
        color:       '#4ade80',
        fillColor:   '#4ade80',
        fillOpacity: 0.05,
        weight:      1,
        dashArray:   '4 4',
      }).addTo(map)

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
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
      const map          = mapRef.current
      const currentIds   = new Set(coins.map(c => c.id))
      const existingIds  = new Set(markersRef.current.keys())

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

        const color     = COIN_COLOR[coin.type]
        const emoji     = COIN_EMOJI[coin.type]
        const dist      = haversineDistance(userLat, userLng, coin.lat, coin.lng)
        const inRange   = dist <= COLLECT_RADIUS_METERS
        const glowClass = `coin-${coin.type}`

        const icon = L.divIcon({
          html: `<div class="coin-marker ${glowClass}" style="
            width:36px;height:36px;font-size:22px;
            border:2px solid ${color}33;
            background:${color}18;
            ${inRange ? `box-shadow:0 0 16px ${color}80;` : ''}
          ">${emoji}</div>`,
          iconSize:   [36, 36],
          iconAnchor: [18, 18],
          className:  '',
        })

        const marker = L.marker([coin.lat, coin.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;padding:4px 0;text-align:center">
              <div style="font-size:24px">${emoji}</div>
              <div style="font-weight:600;color:${color}">${coin.xp_value} XP</div>
              <div style="font-size:12px;color:#888">${Math.round(dist)}m de distancia</div>
              ${inRange
                ? `<button onclick="window._collectCoin('${coin.id}')"
                     style="margin-top:8px;padding:6px 16px;background:${color};
                            border:none;border-radius:8px;cursor:pointer;font-weight:600">
                     ¡Recolectar!
                   </button>`
                : `<div style="font-size:12px;color:#888;margin-top:4px">Acercate más</div>`
              }
            </div>
          `, { className: 'coin-popup' })

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

  return <div ref={containerRef} className="w-full h-full" />
}
