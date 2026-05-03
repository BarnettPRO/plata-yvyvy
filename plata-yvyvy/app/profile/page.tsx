'use client'
import { usePlayer }      from '@/hooks/usePlayer'
import { createClient }   from '@/lib/supabase/client'
import { useRouter }      from 'next/navigation'
import BottomNav          from '@/components/layout/BottomNav'

export default function ProfilePage() {
  const { player, xpProgress } = usePlayer()
  const router   = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  const handleShare = () => {
    if (!player) return
    const text = `¡Jugá Plata Yvyvy! 🥇🇵🇾`
    if (navigator.share) {
      navigator.share({ title: 'Plata Yvyvy', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('¡Plata Yvyvy copiado al portapapeles!')
    }
  }

  if (!player) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D1B0F]">
        <div className="text-2xl animate-spin">⏳</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D1B0F] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 pt-8 pb-4">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10
                            flex items-center justify-center text-4xl mb-3 overflow-hidden">
              👤
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Jugador</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-400 font-bold">Nivel {player.level}</span>
              <span className="text-white/30">·</span>
              <span className="text-white/50">{player.total_value?.toLocaleString() || 0} XP</span>
            </div>
          </div>

          {/* XP progress */}
          {xpProgress && (
            <div className="glass rounded-2xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Progreso al nivel {player.level + 1}</span>
                <span className="text-yellow-400 font-semibold">{xpProgress.percent}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full xp-bar-fill rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress.percent}%` }}
                />
              </div>
              <div className="text-xs text-white/30 mt-1">
                {xpProgress.current} / {xpProgress.needed} XP
              </div>
            </div>
          )}

          {/* Referral */}
          <div className="glass rounded-2xl p-4 mb-4">
            <h2 className="font-semibold text-white mb-1">🎁 Código de referido</h2>
            <p className="text-white/40 text-sm mb-3">
              Invitá amigos y ambos reciben XP bonus
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 font-mono font-bold
                              text-yellow-400 text-center tracking-widest text-lg">
                {player.id?.slice(0, 8).toUpperCase()}
              </div>
              <button
                onClick={handleShare}
                className="bg-yellow-400 text-black font-bold rounded-xl px-4 py-3
                           hover:bg-yellow-300 transition-colors"
              >
                Compartir
              </button>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl text-red-400 border border-red-500/20
                       hover:bg-red-500/10 transition-colors font-semibold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
