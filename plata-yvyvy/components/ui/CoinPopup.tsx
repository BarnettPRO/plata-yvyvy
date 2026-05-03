'use client'
import { useEffect, useState } from 'react'
import { CoinRarity } from '@/types/database.types'
import { COIN_COLOR, COIN_EMOJI } from '@/lib/game/coinGenerator'

interface CollectToast {
  xp:      number
  type:    CoinRarity
  newLevel?: number
}

interface CoinPopupProps {
  toast: CollectToast | null
  onDismiss: () => void
}

export default function CoinPopup({ toast, onDismiss }: CoinPopupProps) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 2500)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  const color = COIN_COLOR[toast.type]
  const emoji = COIN_EMOJI[toast.type]

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
      onClick={onDismiss}
    >
      <div
        className="glass rounded-2xl px-6 py-4 flex items-center gap-3 cursor-pointer"
        style={{ borderColor: `${color}40`, boxShadow: `0 0 24px ${color}30` }}
      >
        <span className="text-3xl animate-coin-pop">{emoji}</span>
        <div>
          <div className="font-display font-bold text-lg" style={{ color }}>
            +{toast.xp} XP
          </div>
          {toast.newLevel && (
            <div className="text-yellow-300 text-sm font-semibold">
              🎉 ¡Nivel {toast.newLevel}!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
