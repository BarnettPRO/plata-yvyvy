'use client'
import { useState, useEffect } from 'react'

interface GeoState {
  lat:     number | null
  lng:     number | null
  error:   string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat:     null,
    lng:     null,
    error:   null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'GPS no disponible en este dispositivo', loading: false }))
      return
    }

    const watcher = navigator.geolocation.watchPosition(
      pos => setState({
        lat:     pos.coords.latitude,
        lng:     pos.coords.longitude,
        error:   null,
        loading: false,
      }),
      err => setState(s => ({
        ...s,
        error:   err.code === 1 ? 'Permiso de ubicación denegado' : 'Error de GPS',
        loading: false,
      })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  return state
}
