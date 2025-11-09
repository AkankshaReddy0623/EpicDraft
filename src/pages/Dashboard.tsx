import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getStories, Story } from '../services/storyService'

export default function Dashboard() {
  const { user, stats, quests, loading: appLoading } = useApp()
  const navigate = useNavigate()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !appLoading) {
      loadStories()
    } else if (!appLoading && !user) {
      setLoading(false)
    }
  }, [user, appLoading])

  const loadStories = async () => {
    try {
      setLoading(true)
      const userStories = await getStories(user?.id)
      setStories(userStories)
    } catch (error) {
      console.error('Error loading stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeQuests = quests.filter(q => !q.completed || !q.claimed).length
  const nextLevelXP = (stats.level * 100) - stats.xp
  const xpProgress = (stats.xp % 100) / 100

  if (appLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-text-lightSecondary dark:text-text-darkSecondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-16">
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark mb-4">Welcome to StoryWeave</h1>
          <p className="text-text-lightSecondary dark:text-text-darkSecondary mb-6">
            Sign in to start creating and collaborating on stories
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your stories and join collaborative rooms</p>
        </div>
        <Link to="/create" className="btn-primary whitespace-nowrap animate-slide-up">
          Create New Story
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30 animate-slide-up">
          <div className="text-center">
            <p className="text-3xl font-bold text-gold mb-1">{stats.points}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">Level {stats.level}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stats.xp} XP</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-800/20 border-orange-200 dark:border-orange-700 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">{user?.streak || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{activeQuests}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Quests</p>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="card mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-900 dark:text-gray-50 font-semibold">Level {stats.level} Progress</span>
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            {stats.xp} / {stats.level * 100} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
            style={{ width: `${xpProgress * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{nextLevelXP} XP to Level {stats.level + 1}</p>
      </div>
      
      {/* My Stories */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">My Stories</h2>
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="card hover:shadow-lg transition-all hover:scale-105 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/room/${story.id}`)}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">{story.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{story.genre}</p>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{story.nodeCount || 0} nodes</span>
                  <span>{story.visibility}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card hover:shadow-lg transition-shadow animate-slide-up">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No stories created yet.</p>
              <Link to="/create" className="btn-secondary inline-block">
                Create Your First Story
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/store" className="card bg-white dark:bg-gray-800 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="text-3xl mb-2">🛒</div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">Visit Store</p>
          </Link>
          <Link to="/quests" className="card bg-white dark:bg-gray-800 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="font-semibold text-text-light dark:text-text-dark">View Quests</p>
          </Link>
          <Link to="/inventory" className="card bg-white dark:bg-gray-800 hover:shadow-md transition-all hover:scale-105 text-center">
            <div className="text-3xl mb-2">📦</div>
            <p className="font-semibold text-text-light dark:text-text-dark">My Inventory</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
