'use client'
interface XPBarProps {
  username: string
  level:    number
  current:  number
  needed:   number
  percent:  number
}

export default function XPBar({ username, level, current, needed, percent }: XPBarProps) {
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3">
      {/* Level badge */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30
                      flex items-center justify-center font-display font-bold text-yellow-400 text-sm">
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-semibold text-sm truncate">{username}</span>
          <span className="text-white/40 text-xs ml-2 flex-shrink-0">{current}/{needed} XP</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full xp-bar-fill rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
