'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'

// Prevent static generation
export const dynamic = 'force-dynamic'

interface LeaderboardEntry {
  id: string
  total_coins: number
  total_value: number
  level: number
  streak_days: number
  plan: string
  rank?: number
}

type SortBy = 'total_coins' | 'total_value' | 'level' | 'streak_days'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('total_coins')
  const [page, setPage] = useState(1)
  const [userRank, setUserRank] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  
  const pageSize = 50

  useEffect(() => {
    fetchLeaderboard()
    fetchCurrentUser()
  }, [sortBy, page])

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient()
      if (!supabase) return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user.id)
        fetchUserRank(user.id)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUserRank = async (userId: string) => {
    try {
      const supabase = createClient()
      if (!supabase) return
      
      const { data } = await supabase
        .rpc('get_user_rank', { 
          user_id: userId, 
          sort_by: sortBy 
        })
      
      if (data) {
        setUserRank(data)
      }
    } catch (error) {
      console.error('Error fetching user rank:', error)
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .order(sortBy, { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Error fetching leaderboard:', error)
      } else {
        const entriesWithRank = data.map((entry, index) => ({
          ...entry,
          rank: (page - 1) * pageSize + index + 1
        }))
        setEntries(entriesWithRank)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSortLabel = (sortBy: SortBy) => {
    switch (sortBy) {
      case 'total_coins': return 'Monedas'
      case 'total_value': return 'Valor Total'
      case 'level': return 'Nivel'
      case 'streak_days': return 'Racha'
      default: return sortBy
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'leyenda': return '👑'
      case 'conquistador': return '⚔️'
      case 'explorador': return '🔍'
      case 'free': return '🆓'
      default: return '👤'
    }
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '⭐'
    return ''
  }

  return (
    <div className="min-h-screen bg-[#0a0d1a]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏆 Tabla de Líderes
          </h1>
          <p className="text-white/60">
            Los mejores jugadores de Plata Yvyvy
          </p>
        </div>

        {/* User's rank */}
        {userRank && currentUser && (
          <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 rounded-xl p-4 mb-6 border border-[#FFD700]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getRankEmoji(userRank)}</div>
                <div>
                  <div className="text-yellow-400 font-semibold">
                    Tu Posición: #{userRank}
                  </div>
                  <div className="text-white/60 text-sm">
                    ¡Seguí jugando para subir en el ranking!
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById(`rank-${userRank}`)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-4 py-2 bg-[#FFD700] text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors"
              >
                Ver mi posición
              </button>
            </div>
          </div>
        )}

        {/* Sort options */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-2">
            {(['total_coins', 'total_value', 'level', 'streak_days'] as SortBy[]).map((sort) => (
              <button
                key={sort}
                onClick={() => {
                  setSortBy(sort)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === sort
                    ? 'bg-[#FFD700] text-black'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {getSortLabel(sort)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard entries */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white/60">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Cargando ranking...
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  id={`rank-${entry.rank}`}
                  className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${
                    entry.id === currentUser ? 'bg-[#FFD700]/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 text-center">
                      <div className="text-xl font-bold text-white">
                        {entry.rank}
                      </div>
                      <div className="text-lg">
                        {getRankEmoji(entry.rank || 0)}
                      </div>
                    </div>

                    {/* Plan icon */}
                    <div className="text-2xl">
                      {getPlanIcon(entry.plan)}
                    </div>

                    {/* User info */}
                    <div>
                      <div className="text-white font-medium">
                        {entry.id === currentUser ? 'Tú' : `Jugador #${entry.id.slice(0, 8)}`}
                      </div>
                      <div className="text-white/60 text-sm capitalize">
                        Plan {entry.plan === 'free' ? 'Buscador' : entry.plan}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {sortBy === 'total_coins' && `${entry.total_coins} monedas`}
                      {sortBy === 'total_value' && `₲${entry.total_value.toLocaleString()}`}
                      {sortBy === 'level' && `Nivel ${entry.level}`}
                      {sortBy === 'streak_days' && `🔥 ${entry.streak_days} días`}
                    </div>
                    <div className="text-white/60 text-sm">
                      {sortBy !== 'total_coins' && `${entry.total_coins} monedas`}
                      {sortBy !== 'total_value' && `₲${entry.total_value.toLocaleString()}`}
                      {sortBy !== 'level' && `Nivel ${entry.level}`}
                      {sortBy !== 'streak_days' && entry.streak_days > 0 && `🔥 ${entry.streak_days} días`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {entries.length === pageSize && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-white/60">
              Página {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3">Leyenda</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span>🆓</span>
              <span className="text-white/60">Buscador</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔍</span>
              <span className="text-white/60">Explorador</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚔️</span>
              <span className="text-white/60">Conquistador</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👑</span>
              <span className="text-white/60">Leyenda</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
