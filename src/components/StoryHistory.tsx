import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStories, Story } from '../services/storyService'

interface StoryHistoryProps {
  userId: string
}

export default function StoryHistory({ userId }: StoryHistoryProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserStories = async () => {
      try {
        setLoading(true)
        const userStories = await getStories(userId)
        setStories(userStories)
      } catch (error) {
        console.error('Error loading story history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadUserStories()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold mx-auto mb-2"></div>
        <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-2">No stories created yet.</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Start creating to see your history here</p>
        <Link to="/create" className="btn-primary text-xs inline-block">
          Create Story
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
      {stories.map((story) => (
        <Link
          key={story.id}
          to={`/room/${story.id}`}
          className="block card hover:shadow-md hover:scale-105 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1 text-sm">
                {story.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{story.genre}</p>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>📝 {story.nodeCount || 0} nodes</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  story.visibility === 'public'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                }`}>
                  {story.visibility}
                </span>
              </div>
            </div>
            <span className="text-gold text-xs">→</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

