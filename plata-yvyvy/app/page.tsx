import { redirect } from 'next/navigation'

export default function Home() {
  try {
    redirect('/login')
  } catch (error) {
    console.error('Redirect failed:', error)
    // Fallback: render something simple
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Plata Yvyvy</h1>
        <p>Redirigiendo a login...</p>
        <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
          Ir a Login
        </a>
      </div>
    )
  }
}
