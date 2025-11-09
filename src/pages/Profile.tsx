import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SpecializationType } from '../types'
import StoryHistory from '../components/StoryHistory'

export default function Profile() {
  const { user, stats, badges, setSpecialization } = useApp()
  const [showSpecializationModal, setShowSpecializationModal] = useState(false)

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-16">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your profile</p>
          <a href="/login" className="btn-primary inline-block">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  const earnedBadges = badges.filter(b => user.badges.includes(b.id))
  const nextLevelXP = (stats.level * 100) - stats.xp
  const xpProgress = (stats.xp % 100) / 100

  const specializations: { type: SpecializationType; name: string; icon: string; description: string }[] = [
    { type: 'plot-master', name: 'Plot Master', icon: '🎭', description: 'Bonus XP for plot twists' },
    { type: 'world-builder', name: 'World Builder', icon: '🌍', description: 'Rewards for lore nodes' },
    { type: 'character-crafter', name: 'Character Crafter', icon: '👤', description: 'Rewards for character growth' },
    { type: 'dialogue-whisperer', name: 'Dialogue Whisperer', icon: '💬', description: 'Dialogue rewards' },
  ]

  const handleSpecializationSelect = async (spec: SpecializationType) => {
    try {
      await setSpecialization(spec)
      setShowSpecializationModal(false)
      // Show success message
      alert(`Specialization set to ${specializations.find(s => s.type === spec)?.name}!`)
    } catch (error) {
      console.error('Error setting specialization:', error)
      alert('Failed to set specialization. Please try again.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">View your stats, badges, and story history</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card md:col-span-2 animate-slide-up">
          <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-24 h-24 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg animate-bounce-in">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-1">{user.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs font-semibold rounded-full">
                  Level {stats.level}
                </span>
                {user.specialization && (
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full">
                    {specializations.find(s => s.type === user.specialization)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Experience</span>
              <span className="font-semibold text-gray-900 dark:text-gray-50">
                {stats.xp} / {stats.level * 100} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                style={{ width: `${xpProgress * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-light mt-1">{nextLevelXP} XP to next level</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">Points</h3>
              <div className="bg-gradient-to-br from-gold/10 to-gold-light/10 rounded-lg p-4 border border-gold/20">
                <p className="text-4xl font-bold text-gold mb-1">{stats.points}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total points earned</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">Streak</h3>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{user.streak} days</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current streak</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">Badges</h3>
              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {earnedBadges.map((badge, index) => (
                    <div
                      key={badge.id}
                      className="card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30 text-center animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">{badge.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card bg-gray-50 min-h-[120px] flex items-center justify-center">
                  <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">No badges earned yet.</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Start writing to earn your first badge!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Stories Created</span>
                <span className="font-bold text-gold">{stats.totalStoriesCreated}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Nodes Written</span>
                <span className="font-bold text-gold">{stats.totalNodesWritten}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Votes Received</span>
                <span className="font-bold text-gold">{stats.totalVotesReceived}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Rank</span>
                <span className="font-bold text-gold">#{Math.floor(Math.random() * 100) + 1}</span>
              </div>
            </div>
          </div>
          
          <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Specialization</h3>
            {user.specialization ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">
                  {specializations.find(s => s.type === user.specialization)?.icon}
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">
                  {specializations.find(s => s.type === user.specialization)?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {specializations.find(s => s.type === user.specialization)?.description}
                </p>
                <button
                  onClick={() => setShowSpecializationModal(true)}
                  className="btn-secondary text-sm mt-4 w-full"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Choose your specialization</p>
                <button
                  onClick={() => setShowSpecializationModal(true)}
                  className="btn-primary text-sm w-full"
                >
                  Select Specialization
                </button>
              </div>
            )}
          </div>
          
          <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Story History</h3>
            <StoryHistory userId={user.id} />
          </div>
        </div>
      </div>

      {/* Specialization Modal */}
      {showSpecializationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-bounce-in">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Choose Specialization</h3>
            <div className="space-y-3 mb-6">
              {specializations.map((spec) => (
                <button
                  key={spec.type}
                  onClick={() => handleSpecializationSelect(spec.type)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    user.specialization === spec.type
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gold hover:bg-gold/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{spec.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">{spec.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{spec.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSpecializationModal(false)}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
