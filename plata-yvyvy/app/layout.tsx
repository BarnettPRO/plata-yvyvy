import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import './globals.css'

const displayFont = Sora({
  subsets:  ['latin'],
  variable: '--font-display',
  weight:   ['400', '600', '700', '800'],
})

const bodyFont = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-body',
  weight:   ['400', '500', '600'],
})

export const metadata: Metadata = {
  title:       'Plata Yvyvy — Monedas Guaraníes',
  description: 'Recolectá monedas guaraníes por todo Paraguay',
  manifest:    '/manifest.json',
  icons: { apple: '/icons/icon-192.png' },
}

export const viewport: Viewport = {
  themeColor:    '#0D1B0F',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-[#0D1B0F] text-white font-body antialiased">
        {children}
      </body>
    </html>
  )
}
