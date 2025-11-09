import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { createStory } from '../services/storyService'

export default function CreateStory() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    visibility: 'public' as 'public' | 'private',
    starterPrompt: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Please sign in to create a story')
      return
    }

    if (!formData.title || !formData.genre) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const storyId = await createStory({
        title: formData.title,
        genre: formData.genre,
        visibility: formData.visibility,
        ownerId: user.id,
        ownerName: user.name,
        description: '',
        starterPrompt: formData.starterPrompt,
        contributors: [user.id],
      })
      
      navigate(`/room/${storyId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create story')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-16">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to create a story</p>
          <Link to="/login" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-8">
        <Link to="/home" className="text-gold hover:text-gold-dark transition-colors text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">Create New Story</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Start a new collaborative story adventure</p>
      </div>
      
      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Story Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter story title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Genre <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              required
            >
              <option value="">Select a genre...</option>
              <option>Fantasy</option>
              <option>Sci-Fi</option>
              <option>Mystery</option>
              <option>Romance</option>
              <option>Horror</option>
              <option>Adventure</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Visibility <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' })}
              required
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Starter Prompt <span className="text-gray-600 dark:text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              rows={6}
              className="input-field resize-none"
              placeholder="Write the opening scene or prompt for your story..."
              value={formData.starterPrompt}
              onChange={(e) => setFormData({ ...formData, starterPrompt: e.target.value })}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This will be the first node of your story</p>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Link to="/home" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
