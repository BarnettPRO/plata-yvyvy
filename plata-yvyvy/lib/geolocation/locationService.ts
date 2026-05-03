// Plata Yvyvy — Geolocation Service for City/Barrio Detection

export interface LocationData {
  city: string
  barrio: string
  country: string
}

export interface Coordinates {
  lat: number
  lng: number
}

// Major Paraguayan cities with approximate coordinates
const PARAGUAYAN_CITIES = [
  { name: 'Asunción', lat: -25.2667, lng: -57.5833, radius: 0.05 },
  { name: 'Ciudad del Este', lat: -25.5097, lng: -54.6111, radius: 0.05 },
  { name: 'Encarnación', lat: -27.3364, lng: -55.8641, radius: 0.05 },
  { name: 'San Lorenzo', lat: -25.3417, lng: -57.5083, radius: 0.03 },
  { name: 'Luque', lat: -25.2708, lng: -57.4944, radius: 0.03 },
  { name: 'Capiatá', lat: -25.3833, lng: -57.4167, radius: 0.03 },
  { name: 'Lambaré', lat: -25.3528, lng: -57.5583, radius: 0.03 },
  { name: 'Fernando de la Mora', lat: -25.3222, lng: -57.5333, radius: 0.03 },
  { name: 'Limpio', lat: -25.1833, lng: -57.5167, radius: 0.03 },
  { name: 'Ñemby', lat: -25.3917, lng: -57.5667, radius: 0.03 }
]

// Calculate distance between two coordinates in degrees (simplified for small distances)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Detect city based on coordinates
function detectCity(lat: number, lng: number): string {
  for (const city of PARAGUAYAN_CITIES) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng)
    if (distance <= city.radius * 111) { // Convert degrees to km (approximately)
      return city.name
    }
  }
  return 'Otra Ciudad'
}

// Mock barrio detection - in production, this would use reverse geocoding API
function detectBarrio(lat: number, lng: number, city: string): string {
  // This is a simplified mock implementation
  // In production, you'd use a reverse geocoding service like Nominatim or Google Maps
  
  if (city === 'Asunción') {
    // Simplified barrio detection for Asunción based on coordinates
    if (lat > -25.28 && lng > -57.60) return 'Sajonia'
    if (lat > -25.27 && lng < -57.55) return 'Villa Morra'
    if (lat < -25.27 && lng < -57.57) return 'San Roque'
    if (lat < -25.28 && lng > -57.58) return 'Sacramento'
    return 'Centro'
  }
  
  if (city === 'Ciudad del Este') {
    if (lat > -25.50 && lng > -54.62) return 'Zona Alta'
    if (lat < -25.52 && lng < -54.60) return 'Zona Baja'
    return 'Centro'
  }
  
  // For other cities, return generic barrio names based on coordinates
  const barrioNumber = Math.floor(Math.abs(lat * 100) % 10) + 1
  return `Barrio ${barrioNumber}`
}

// Main function to get location data from coordinates
export async function getLocationFromCoordinates(lat: number, lng: number): Promise<LocationData> {
  // Check if coordinates are within Paraguay (approximate bounds)
  if (lat < -28 || lat > -19 || lng < -62 || lng > -54) {
    return {
      city: 'Otra Ciudad',
      barrio: 'Desconocido',
      country: 'Paraguay'
    }
  }

  const city = detectCity(lat, lng)
  const barrio = detectBarrio(lat, lng, city)

  return {
    city,
    barrio,
    country: 'Paraguay'
  }
}

// Get user's current location and return location data
export async function getCurrentLocation(): Promise<{ coords: Coordinates; location: LocationData } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        try {
          const location = await getLocationFromCoordinates(coords.lat, coords.lng)
          resolve({ coords, location })
        } catch (error) {
          console.error('Error getting location data:', error)
          resolve(null)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}

// Update user profile with location data
export async function updateUserLocation(userId: string, lat: number, lng: number): Promise<boolean> {
  try {
    const location = await getLocationFromCoordinates(lat, lng)
    
    // This would be called from the API route
    // For now, return the location data to be used elsewhere
    console.log('Updating user location:', { userId, location })
    return true
  } catch (error) {
    console.error('Error updating user location:', error)
    return false
  }
}
