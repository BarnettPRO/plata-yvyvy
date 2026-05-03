'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/map',     icon: '🗺️',  label: 'Mapa'    },
  { href: '/ranking', icon: '✨',  label: 'Elegidos' },
  { href: '/profile', icon: '👤',  label: 'Perfil'  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="glass fixed bottom-0 inset-x-0 z-40 flex items-center justify-around
                    h-16 px-4 border-t border-white/5">
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all duration-200
                        ${active ? 'text-yellow-400' : 'text-white/40 hover:text-white/70'}`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
            {active && (
              <div className="absolute bottom-2 w-1 h-1 rounded-full bg-yellow-400" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
