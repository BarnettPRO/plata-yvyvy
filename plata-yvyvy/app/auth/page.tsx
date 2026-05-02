'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      setMessage('¡Revisá tu email para el enlace de acceso!')
    } catch (error: any) {
      setMessage(error.message || 'Error al enviar el email')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setMessage(error.message || 'Error al iniciar con Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0d1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥇</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#FFD700]">Plata</span>{' '}
            <span className="text-white">Yvyvy</span>
          </h1>
          <p className="text-white/60">
            Iniciá sesión para empezar a buscar monedas
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700] focus:bg-white/15 transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-black bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Enviando...' : 'Enviar enlace mágico'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-4 text-white/40 text-sm">o</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Continuar con Google
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('error') 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-white/40 text-sm">
            ¿No tenés cuenta?{' '}
            <Link href="/auth" className="text-[#FFD700] hover:text-yellow-400">
              Creá una gratis
            </Link>
          </p>
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
