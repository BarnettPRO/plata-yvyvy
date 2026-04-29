import { CoinType } from '@/types/database.types'

const COIN_WEIGHTS: Record<CoinType, number> = {
  bronze: 0.60,
  silver: 0.30,
  gold:   0.10,
}

const XP_RANGES: Record<CoinType, [number, number]> = {
  bronze: [1, 50],
  silver: [51, 200],
  gold:   [201, 500],
}

export function randomCoinType(): CoinType {
  const roll = Math.random()
  if (roll < COIN_WEIGHTS.bronze) return 'bronze'
  if (roll < COIN_WEIGHTS.bronze + COIN_WEIGHTS.silver) return 'silver'
  return 'gold'
}

export function randomXP(type: CoinType): number {
  const [min, max] = XP_RANGES[type]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Spawns N coins around a center point within radiusKm */
export function generateCoinsAround(
  centerLat: number,
  centerLng: number,
  count: number = 8,
  radiusKm: number = 0.5
) {
  return Array.from({ length: count }, () => {
    // Random point within circle using polar coords
    const angle = Math.random() * 2 * Math.PI
    const r = radiusKm * Math.sqrt(Math.random())
    const dLat = (r / 111.32) * Math.cos(angle)
    const dLng = (r / (111.32 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle)

    const type = randomCoinType()
    return {
      type,
      xp_value: randomXP(type),
      lat: centerLat + dLat,
      lng: centerLng + dLng,
      is_collected: false,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min TTL
    }
  })
}

export function xpForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function levelFromXP(xp: number): number {
  let level = 1
  let accumulated = 0
  while (accumulated + xpForNextLevel(level) <= xp) {
    accumulated += xpForNextLevel(level)
    level++
  }
  return level
}

export const COIN_EMOJI: Record<CoinType, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold:   '🥇',
}

export const COIN_COLOR: Record<CoinType, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold:   '#FFD700',
}
