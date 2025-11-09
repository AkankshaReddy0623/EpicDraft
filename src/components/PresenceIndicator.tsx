import { useEffect, useState } from 'react'
import { subscribeToPresence, Presence } from '../services/presenceService'

interface PresenceIndicatorProps {
  storyId: string
  currentUserId: string
}

export default function PresenceIndicator({ storyId, currentUserId }: PresenceIndicatorProps) {
  const [presences, setPresences] = useState<Presence[]>([])

  useEffect(() => {
    if (!storyId) return

    const unsubscribe = subscribeToPresence(storyId, (presences) => {
      // Filter out current user
      const others = presences.filter(p => p.userId !== currentUserId)
      setPresences(others)
    })

    return () => unsubscribe()
  }, [storyId, currentUserId])

  if (presences.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 rounded-lg border border-gold/20">
      <div className="flex -space-x-2">
        {presences.slice(0, 3).map((presence, index) => (
          <div
            key={presence.userId}
            className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white font-bold text-xs border-2 border-white dark:border-gray-900 relative animate-pulse"
            style={{ zIndex: 10 - index }}
            title={presence.userName}
          >
            {presence.userAvatar ? (
              <img
                src={presence.userAvatar}
                alt={presence.userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              presence.userName.charAt(0).toUpperCase()
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          </div>
        ))}
      </div>
      {presences.length > 3 && (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
          +{presences.length - 3} more
        </span>
      )}
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {presences.length === 1 ? 'person' : 'people'} online
      </span>
    </div>
  )
}

