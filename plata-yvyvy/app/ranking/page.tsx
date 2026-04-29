'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/layout/BottomNav'

interface Player {
  id:        string
  username:  string
  avatar_url: string | null
  total_xp:  number
  level:     number
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [ranking, setRanking] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(d => { setRanking(d.ranking ?? []); setLoading(false) })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#0D1B0F] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 pt-6 pb-4">
          <h1 className="font-display text-2xl font-bold text-[#FFD700]">🏆 Ranking Global</h1>
          <p className="text-white/40 text-sm mt-1">Top jugadores de Paraguay</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-2xl animate-spin">⏳</div>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {ranking.map((player, i) => (
              <div
                key={player.id}
                className={`glass rounded-2xl p-4 flex items-center gap-3
                  ${i === 0 ? 'border border-yellow-400/30' : ''}
                `}
              >
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="text-white/30 text-lg font-bold">{i + 1}</span>}
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center
                                text-xl flex-shrink-0 overflow-hidden">
                  {player.avatar_url
                    ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                    : '👤'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{player.username}</div>
                  <div className="text-xs text-white/40">Nivel {player.level}</div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-yellow-400">
                    {player.total_xp.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/40">XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
