export type CoinType = 'bronze' | 'silver' | 'gold'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          total_xp: number
          level: number
          referral_code: string
          referred_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      coins: {
        Row: {
          id: string
          type: CoinType
          xp_value: number
          lat: number
          lng: number
          is_collected: boolean
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['coins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['coins']['Insert']>
      }
      collections: {
        Row: {
          id: string
          user_id: string
          coin_id: string
          xp_gained: number
          collected_at: string
          user_lat: number
          user_lng: number
        }
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'collected_at'>
        Update: never
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement: string
          unlocked_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id' | 'unlocked_at'>
        Update: never
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      coin_type: CoinType
    }
  }
}

export type UserRow       = Database['public']['Tables']['users']['Row']
export type CoinRow       = Database['public']['Tables']['coins']['Row']
export type CollectionRow = Database['public']['Tables']['collections']['Row']
export type AchievementRow = Database['public']['Tables']['user_achievements']['Row']
