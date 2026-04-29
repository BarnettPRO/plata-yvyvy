export interface Achievement {
  slug: string
  name: string
  description: string
  emoji: string
  check: (stats: PlayerStats) => boolean
}

export interface PlayerStats {
  totalCoins: number
  goldCoins: number
  totalXP: number
  level: number
  referrals: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    slug: 'first_coin',
    name: 'Primer Guaraní',
    description: 'Recolectaste tu primera moneda',
    emoji: '🌟',
    check: s => s.totalCoins >= 1,
  },
  {
    slug: 'bronze_master',
    name: 'Rey del Bronce',
    description: 'Recolectaste 50 monedas de bronce',
    emoji: '🥉',
    check: s => s.totalCoins >= 50,
  },
  {
    slug: 'gold_hunter',
    name: 'Cazador de Oro',
    description: 'Encontraste tu primera moneda de oro',
    emoji: '🥇',
    check: s => s.goldCoins >= 1,
  },
  {
    slug: 'level_5',
    name: 'Guerrero Guaraní',
    description: 'Alcanzaste el nivel 5',
    emoji: '⚔️',
    check: s => s.level >= 5,
  },
  {
    slug: 'level_10',
    name: 'Cacique',
    description: 'Alcanzaste el nivel 10',
    emoji: '👑',
    check: s => s.level >= 10,
  },
  {
    slug: 'social_butterfly',
    name: 'Embajador',
    description: 'Invitaste a 5 amigos',
    emoji: '🦋',
    check: s => s.referrals >= 5,
  },
]

export function checkNewAchievements(
  stats: PlayerStats,
  existingSlugs: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(
    a => !existingSlugs.includes(a.slug) && a.check(stats)
  )
}
