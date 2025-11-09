import { useApp } from '../context/AppContext'

export default function Quests() {
  const { quests, claimQuest, stats } = useApp()

  const activeQuests = quests.filter(q => !q.completed || !q.claimed)
  const completedQuests = quests.filter(q => q.completed && q.claimed)

  const getProgressPercentage = (quest: typeof quests[0]) => {
    return Math.min((quest.progress / quest.requirementValue) * 100, 100)
  }

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'write-node': return '✍️'
      case 'plot-twist': return '🎭'
      case 'upvoted-entry': return '👍'
      case 'streak': return '🔥'
      default: return '📋'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Quests & Missions</h1>
        <p className="text-gray-600 dark:text-gray-400">Complete quests to earn points and XP</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30 animate-slide-up">
          <div className="text-center">
            <p className="text-3xl font-bold text-gold mb-1">{activeQuests.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Quests</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 mb-1">{completedQuests.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 mb-1">Level {stats.level}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stats.xp} XP</p>
          </div>
        </div>
      </div>

      {/* Active Quests */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Active Quests</h2>
        <div className="space-y-4">
          {activeQuests.map((quest, index) => (
            <div
              key={quest.id}
              className={`card hover:shadow-lg transition-all duration-300 animate-slide-up ${
                quest.completed ? 'border-2 border-gold bg-gold/5' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{getQuestIcon(quest.requirementType)}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">{quest.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{quest.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-50">
                          {quest.progress} / {quest.requirementValue}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            quest.completed ? 'bg-gold' : 'bg-gold-light'
                          }`}
                          style={{ width: `${getProgressPercentage(quest)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="mb-2">
                    <p className="text-gold font-bold text-lg">+{quest.rewardPoints} pts</p>
                    <p className="text-text-light text-sm">+{quest.rewardXP} XP</p>
                  </div>
                  {quest.completed && !quest.claimed && (
                    <button
                      onClick={() => claimQuest(quest.id)}
                      className="btn-primary text-sm animate-bounce-in"
                    >
                      Claim Rewards
                    </button>
                  )}
                  {quest.claimed && (
                    <span className="text-green-600 text-sm font-semibold">✓ Claimed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Completed Quests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedQuests.map((quest, index) => (
              <div
                key={quest.id}
                className="card opacity-75 hover:opacity-100 transition-opacity animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getQuestIcon(quest.requirementType)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">{quest.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">✓ Completed</p>
                  </div>
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeQuests.length === 0 && completedQuests.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">No quests available</h2>
          <p className="text-gray-600 dark:text-gray-400">Check back later for new quests!</p>
        </div>
      )}
    </div>
  )
}

