'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import { createClient } from '@/lib/supabase/client'

interface Player {
  id: string
  username: string
  level: number
  total_value: number
  rank: number
  isCurrentUser: boolean
  crown?: string
  relationship?: string
  isBarrioOwner?: boolean
}

interface RankingResponse {
  rankings: Player[]
  type: string
  message?: string
  city?: string
  barrio?: string
  referralCode?: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<'national' | 'city' | 'barrio' | 'friends'>('city')
  const [rankingData, setRankingData] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const tabs = [
    { id: 'national', label: '🇵🇾 Nación', icon: '👑' },
    { id: 'city', label: '🏙️ Ciudad', icon: '✨' },
    { id: 'barrio', label: '🏘️ Barrio', icon: '�' },
    { id: 'friends', label: '👥 Linaje', icon: '�' },
  ]

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase!.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    fetchRankings()
  }, [activeTab, userId])

  const fetchRankings = async () => {
    setLoading(true)
    try {
      const url = `/api/rankings?type=${activeTab}${userId ? `&userId=${userId}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setRankingData(data)
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShareReferral = () => {
    if (rankingData?.referralCode) {
      const text = `¿Sos uno de los elegidos? ✨🇵🇾\nUnite a la búsqueda de la Plata Yvyvy\nCódigo de linaje: ${rankingData.referralCode}`
      if (navigator.share) {
        navigator.share({ 
          title: 'Los Elegidos - Plata Yvyvy',
          text 
        })
      } else {
        navigator.clipboard.writeText(text)
        alert('¡Código de linaje copiado al portapapeles!')
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D1B0F] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="font-display text-2xl font-bold text-[#FFD700]">✨ Los Elegidos</h1>
          <p className="text-white/60 text-sm mt-1">Solo los destinados encuentran la Plata Yvyvy</p>
        </div>
        <p className="text-white/40 text-sm mt-1">
          {rankingData?.city && activeTab === 'city' && `📍 ${rankingData.city}`}
          {rankingData?.barrio && activeTab === 'barrio' && `📍 ${rankingData.barrio}`}
        </p>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="glass rounded-xl p-1 flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'national' | 'city' | 'barrio' | 'friends')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                  activeTab === tab.id
                    ? 'bg-yellow-400 text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-2xl animate-spin">⏳</div>
          </div>
        ) : rankingData?.message ? (
          <div className="px-4">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">🔮</div>
              <p className="text-white/80 mb-4">{rankingData.message}</p>
              {rankingData.referralCode && (
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-xs text-white/60 mb-1">Tu código de linaje:</div>
                    <div className="font-mono text-lg font-bold text-yellow-400">
                      {rankingData.referralCode}
                    </div>
                  </div>
                  <button
                    onClick={handleShareReferral}
                    className="bg-yellow-400 text-black font-bold rounded-xl px-6 py-3
                             hover:bg-yellow-300 transition-colors w-full"
                  >
                    📤 Compartir linaje
                  </button>
                  <p className="text-xs text-white/40">
                    Compartí tu destino con otros elegidos
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {rankingData?.rankings && rankingData.rankings.length > 0 ? rankingData.rankings.map((player) => (
              <div
                key={player.id}
                className={`glass rounded-2xl p-4 flex items-center gap-3
                  ${player.isCurrentUser ? 'border-2 border-yellow-400 bg-yellow-400/5' : ''}
                `}
              >
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {player.crown || (
                    <span className={`font-bold ${
                      player.isCurrentUser ? 'text-yellow-400' : 'text-white/30'
                    }`}>
                      {player.rank}
                    </span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center
                                text-xl flex-shrink-0">
                  👤
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${
                    player.isCurrentUser ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {player.username}
                    {player.isCurrentUser && ' (Tú)'}
                    {player.isBarrioOwner && (
                      <span className="ml-2 text-purple-400 font-bold">👑 Dueño del barrio</span>
                    )}
                  </div>
                  <div className="text-xs text-white/40">
                    Nivel {player.level}
                    {activeTab === 'friends' && player.relationship && player.relationship !== 'Tú' && (
                      <span className="ml-2 text-blue-400">• {player.relationship}</span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`font-display font-bold ${
                    player.isCurrentUser ? 'text-yellow-400' : 'text-yellow-400'
                  }`}>
                    ₲{player.total_value.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/40">Capital</div>
                </div>
              </div>
            )) : (
              <div className="px-4">
                <div className="glass rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-4">🔮</div>
                  <p className="text-white/80 mb-4">Ningún elegido en esta categoría aún</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
