export type PlanType = 'free' | 'explorador' | 'conquistador' | 'leyenda'
export type CoinRarity = 'common' | 'rare' | 'legendary'
export type CoinValue = 50 | 100 | 500 | 1000

export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string
          plan: PlanType
          coins_collected_today: number
          streak_days: number
          radar_pings_today: number | null
          clan: string | null
          total_coins: number
          total_value: number
          level: number
          achievements: string[]
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profile']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profile']['Insert']>
      }
      coins: {
        Row: {
          id: string
          lat: number
          lng: number
          value: CoinValue
          rarity: CoinRarity
          sponsored_by: string | null
          placed_by_user: string | null
          event_tag: string | null
          collected: boolean
          collected_by: string | null
          collected_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['coins']['Row'], 'id' | 'created_at' | 'collected_at'>
        Update: Partial<Database['public']['Tables']['coins']['Insert']>
      }
      collections: {
        Row: {
          id: string
          user_id: string
          coin_id: string
          value: number
          rarity: CoinRarity
          user_lat: number
          user_lng: number
          collected_at: string
        }
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'collected_at'>
        Update: never
      }
    }
    Views: {}
    Functions: {
      get_radar_pings_remaining: {
        Args: { user_uuid: string }
        Returns: number | null
      }
      can_collect_more_today: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      can_see_rarity: {
        Args: { user_uuid: string; target_rarity: CoinRarity }
        Returns: boolean
      }
      daily_reset: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      plan_type: PlanType
      coin_rarity: CoinRarity
    }
  }
}

export type UserProfileRow = Database['public']['Tables']['user_profile']['Row']
export type CoinRow = Database['public']['Tables']['coins']['Row']
export type CollectionRow = Database['public']['Tables']['collections']['Row']

// Helper types for the app
export interface PlanConfig {
  name: string
  price: number
  dailyCoinLimit: number | 'unlimited'
  radarPings: number | 'unlimited'
  canSeeRare: boolean
  canSeeLegendary: boolean
  canPlaceCoins: boolean
  hasHeatmap: boolean
  hasCrownBadge: boolean
  hasTournament: boolean
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Buscador',
    price: 0,
    dailyCoinLimit: 10,
    radarPings: 3,
    canSeeRare: false,
    canSeeLegendary: false,
    canPlaceCoins: false,
    hasHeatmap: false,
    hasCrownBadge: false,
    hasTournament: false,
  },
  explorador: {
    name: 'Explorador',
    price: 1.99,
    dailyCoinLimit: 'unlimited',
    radarPings: 'unlimited',
    canSeeRare: true,
    canSeeLegendary: false,
    canPlaceCoins: false,
    hasHeatmap: false,
    hasCrownBadge: false,
    hasTournament: false,
  },
  conquistador: {
    name: 'Conquistador',
    price: 3.99,
    dailyCoinLimit: 'unlimited',
    radarPings: 'unlimited',
    canSeeRare: true,
    canSeeLegendary: true,
    canPlaceCoins: true,
    hasHeatmap: true,
    hasCrownBadge: false,
    hasTournament: false,
  },
  leyenda: {
    name: 'Leyenda',
    price: 4.99,
    dailyCoinLimit: 'unlimited',
    radarPings: 'unlimited',
    canSeeRare: true,
    canSeeLegendary: true,
    canPlaceCoins: true,
    hasHeatmap: true,
    hasCrownBadge: true,
    hasTournament: true,
  },
}

export const COIN_CONFIGS: Record<CoinRarity, { color: string; emoji: string; valueRange: CoinValue[] }> = {
  common: {
    color: '#CD7F32', // bronze
    emoji: '🥉',
    valueRange: [50, 100],
  },
  rare: {
    color: '#3B82F6', // blue
    emoji: '🥈',
    valueRange: [100, 500],
  },
  legendary: {
    color: '#EC4899', // pink
    emoji: '🥇',
    valueRange: [500, 1000],
  },
}
