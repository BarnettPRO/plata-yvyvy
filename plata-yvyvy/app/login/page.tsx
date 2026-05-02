'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router                = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      if (!supabase) {
        setError('Error de conexión. Intentá de nuevo.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })

      if (error) setError(error.message)
      else setSent(true)
    } catch (error) {
      setError('Error al enviar el link mágico')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      const supabase = createClient()
      if (!supabase) {
        setError('Error de conexión. Intentá de nuevo.')
        return
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (error) {
      setError('Error al iniciar con Google')
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1B0F] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥇</div>
          <h1 className="font-display text-3xl font-bold text-[#FFD700]">Plata Yvyvy</h1>
          <p className="text-white/50 mt-2">Iniciá sesión para jugar</p>
        </div>

        {sent ? (
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-display text-xl font-semibold mb-2">¡Revisá tu email!</h2>
            <p className="text-white/60 text-sm">
              Te mandamos un link mágico a <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="glass rounded-2xl p-6 space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-white placeholder-white/30 focus:outline-none
                           focus:border-yellow-400/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-black bg-[#FFD700]
                         hover:bg-yellow-300 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Enviando...' : '✉️ Recibir link mágico'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs text-white/40">
                <span className="bg-transparent px-2">o continuar con</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full py-3 rounded-xl font-semibold text-white
                         bg-white/5 hover:bg-white/10 border border-white/10
                         transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.7 29.3 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.2 3l5.7-5.7C34.3 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 6 1.1 8.2 3l5.7-5.7C34.3 5.1 29.4 3 24 3 16.3 3 9.7 7.9 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 45c5.2 0 10-1.9 13.7-5L31 33.9C28.9 35.3 26.5 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.4 37.5 16.1 45 24 45z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.7 5.2C41.6 35.2 44 30 44 24c0-1.3-.2-2.7-.4-4z"/>
              </svg>
              Google
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
