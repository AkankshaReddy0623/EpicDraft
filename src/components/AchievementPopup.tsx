import { useEffect, useState } from 'react'

interface AchievementPopupProps {
  title: string
  description: string
  icon?: string
  points?: number
  onClose: () => void
}

export default function AchievementPopup({
  title,
  description,
  icon = '🏆',
  points,
  onClose,
}: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
    >
      <div className="bg-gradient-to-br from-gold via-gold-light to-gold-dark rounded-2xl shadow-2xl p-8 border-4 border-white/50 animate-bounce-in min-w-[400px] max-w-[500px]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-6xl animate-float">{icon}</div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
              <p className="text-white/90 text-sm">{description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {points && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <div className="flex items-center gap-2 text-white">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-lg">+{points} Points</span>
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-2xl pointer-events-none"></div>
      </div>
    </div>
  )
}

