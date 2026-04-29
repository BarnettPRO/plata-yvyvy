import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D1B0F] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <div className="text-8xl mb-6 animate-bounce">🥇</div>

        <h1 className="font-display text-5xl font-bold mb-3 leading-tight">
          <span className="text-[#FFD700]">Plata</span>{' '}
          <span className="text-white">Yvyvy</span>
        </h1>

        <p className="text-green-300/80 text-lg mb-2 font-display italic">
          "Plata del Cielo"
        </p>

        <p className="text-white/60 mb-10 leading-relaxed">
          Explorá Paraguay y recolectá monedas guaraníes escondidas por todo el país.
          Subí de nivel, desbloqueá logros y competí con jugadores de todo el país.
        </p>

        {/* Coin types */}
        <div className="flex justify-center gap-6 mb-10">
          {[
            { emoji: '🥉', label: 'Bronce', sub: '1-50 XP', color: 'text-amber-700' },
            { emoji: '🥈', label: 'Plata',  sub: '51-200 XP', color: 'text-gray-300' },
            { emoji: '🥇', label: 'Oro',    sub: '201-500 XP', color: 'text-yellow-400' },
          ].map(c => (
            <div key={c.label} className="text-center">
              <div className="text-3xl mb-1">{c.emoji}</div>
              <div className={`text-sm font-semibold ${c.color}`}>{c.label}</div>
              <div className="text-xs text-white/40">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="block w-full py-4 rounded-2xl font-display font-bold text-lg text-black
                     bg-[#FFD700] hover:bg-yellow-300 transition-all duration-200
                     shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)]"
        >
          Empezar a jugar 🇵🇾
        </Link>

        <p className="mt-4 text-white/30 text-sm">
          Requiere GPS habilitado
        </p>
      </div>
    </main>
  )
}
