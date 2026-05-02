'use client'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

// Prevent static generation
export const dynamic = 'force-dynamic'

export default function Home() {
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          setLoading(false)
          return
        }
        
        const { data, error } = await supabase
          .from('user_profile')
          .select('id, total_coins, total_value, level')
          .order('total_coins', { ascending: false })
          .limit(3)

        if (error) {
          console.error('Error fetching top players:', error)
          setError(error.message)
        } else if (data) {
          setTopPlayers(data)
        }
      } catch (error) {
        console.error('Error fetching top players:', error)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchTopPlayers()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0d1a] via-[#1a1f3a] to-[#0a0d1a]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#0038A8]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="text-8xl mb-8 animate-bounce">🥇</div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-[#FFD700]">Plata</span>{' '}
            <span className="text-white">Yvyvy</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-4 font-medium">
            "Plata del Cielo"
          </p>

          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Descubrí monedas guaraníes escondidas en todo Paraguay. 
            Explorá, recolectá y competí con jugadores de todo el país.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth"
              className="px-8 py-4 rounded-xl font-bold text-lg text-black bg-[#FFD700] hover:bg-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Empezar Gratis
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl font-bold text-lg text-white border-2 border-white/20 hover:bg-white/10 transition-all duration-200"
            >
              Ver Planes
            </Link>
          </div>

          <p className="text-white/40 text-sm">
            Requiere GPS habilitado · Disponible en Paraguay 🇵🇾
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Cómo funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Iniciá Sesión',
                description: 'Creá tu cuenta gratis o usá Google para empezar tu aventura.',
                icon: '📱',
              },
              {
                step: '2', 
                title: 'Explorá el Mapa',
                description: 'Activá el GPS y buscá monedas cercanas en tu zona.',
                icon: '🗺️',
              },
              {
                step: '3',
                title: 'Recolectá',
                description: 'Acercate a menos de 50m y tocá la moneda para recolectarla.',
                icon: '🪙',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-6xl mb-4">{item.icon}</div>
                <div className="text-3xl font-bold text-[#FFD700] mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Teaser */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            🏆 Líderes del Momento
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {loading ? (
              <div className="col-span-3 text-center text-white/60">
                Cargando líderes...
              </div>
            ) : topPlayers.length === 0 ? (
              <div className="col-span-3 text-center text-white/60">
                ¡Sé el primero en empezar a jugar!
              </div>
            ) : (
              topPlayers.map((player, index) => (
                <div key={player.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-[#FFD700]">#{index + 1}</div>
                    <div className="text-3xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  </div>
                  <div className="text-white font-semibold mb-2">Jugador #{player.id.slice(0, 8)}</div>
                  <div className="text-white/60 text-sm">
                    <div>🪙 {player.total_coins} monedas</div>
                    <div>💰 ₲{player.total_value.toLocaleString()}</div>
                    <div>⭐ Nivel {player.level}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/leaderboard"
              className="inline-flex items-center px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Ver Ranking Completo →
            </Link>
          </div>
        </div>
      </section>

      {/* Sponsored Coins */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Monedas Especiales
          </h2>
          <p className="text-white/60 mb-12 max-w-2xl mx-auto">
            Encontrá monedas patrocinadas por marcas locales y ganá recompensas exclusivas.
            ¡Las monedas doradas valen el doble!
          </p>

          <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 rounded-2xl p-8 border border-[#FFD700]/30 max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Nuestros Sponsors
            </h3>
            <p className="text-white/80 mb-6">
              ¿Querés patrocinar monedas y llegar a miles de jugadores?
            </p>
            <button className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Contactar Ventas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="text-3xl mr-3">🥇</span>
            <span className="text-xl font-bold text-white">
              <span className="text-[#FFD700]">Plata</span> Yvyvy
            </span>
          </div>
          <p className="text-white/60 mb-4">
            El juego de geolocalización más popular de Paraguay
          </p>
          <div className="flex justify-center space-x-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/60 transition-colors">Términos</a>
            <a href="#" className="hover:text-white/60 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white/60 transition-colors">Contacto</a>
          </div>
          <p className="text-white/30 text-xs mt-6">
            © 2024 Plata Yvyvy. Hecho con ❤️ en Paraguay 🇵🇾
          </p>
        </div>
      </footer>
    </div>
  )
}
