import { CoinRarity } from '@/types/database.types'

const COIN_WEIGHTS: Record<CoinRarity, number> = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01,
}

const VALUE_RANGES: Record<CoinRarity, [number, number]> = {
  common: [50000, 50000],
  uncommon: [500000, 500000],
  rare: [2000000, 2000000],
  epic: [10000000, 10000000],
  legendary: [50000000, 50000000],
}

export function randomCoinRarity(): CoinRarity {
  const roll = Math.random()
  if (roll < COIN_WEIGHTS.common) return 'common'
  if (roll < COIN_WEIGHTS.common + COIN_WEIGHTS.uncommon) return 'uncommon'
  if (roll < COIN_WEIGHTS.common + COIN_WEIGHTS.uncommon + COIN_WEIGHTS.rare) return 'rare'
  if (roll < COIN_WEIGHTS.common + COIN_WEIGHTS.uncommon + COIN_WEIGHTS.rare + COIN_WEIGHTS.epic) return 'epic'
  return 'legendary'
}

export function randomValue(rarity: CoinRarity): number {
  const [min, max] = VALUE_RANGES[rarity]
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

    const rarity = randomCoinRarity()
    return {
      rarity,
      value: randomValue(rarity),
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

export const COIN_EMOJI: Record<CoinRarity, string> = {
  common: '🪙',
  uncommon: '💰',
  rare: '🎖️',
  epic: '💎',
  legendary: '👑',
}

export const COIN_COLOR: Record<CoinRarity, string> = {
  common: '#8B7355',
  uncommon: '#CD853F',
  rare: '#FFD700',
  epic: '#FF6B6B',
  legendary: '#FF1744',
}
