import { useState } from 'react'
import { generateStorySuggestions, AISuggestion } from '../services/aiService'

interface ImprovedAIHelperProps {
  storyContent: string
  currentNodeContent: string
  onInsertSuggestion: (text: string) => void
}

export default function ImprovedAIHelper({ storyContent, currentNodeContent, onInsertSuggestion }: ImprovedAIHelperProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<'dialogue' | 'plot' | 'description' | 'character'>('dialogue')
  const [showHelper, setShowHelper] = useState(false)

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const context = currentNodeContent || storyContent
      const results = await generateStorySuggestions(context, selectedType)
      setSuggestions(results)
    } catch (error) {
      console.error('Error loading suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  if (!showHelper) {
    return (
      <button
        onClick={() => {
          setShowHelper(true)
          loadSuggestions()
        }}
        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center gap-1 transition-colors"
      >
        <span>✨</span> AI Helper
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-bounce-in shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <span>✨</span> AI Story Assistant
          </h3>
          <button
            onClick={() => setShowHelper(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Get AI-powered suggestions to enhance your story. Choose a type and click generate!
        </p>

        {/* Type Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['dialogue', 'plot', 'description', 'character'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type)
                setSuggestions([])
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                selectedType === type
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {type === 'dialogue' && '💬 Dialogue'}
              {type === 'plot' && '🎭 Plot Twist'}
              {type === 'description' && '📝 Description'}
              {type === 'character' && '👤 Character Action'}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="btn-primary w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating...
            </span>
          ) : (
            '✨ Generate Suggestions'
          )}
        </button>

        {/* Suggestions */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">AI is thinking...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Suggestions ({suggestions.length}):
            </p>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-gray-900 dark:text-gray-50 flex-1 leading-relaxed">
                    {suggestion.content}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 ml-2 whitespace-nowrap">
                    {Math.round(suggestion.confidence * 100)}% match
                  </span>
                </div>
                <button
                  onClick={() => {
                    onInsertSuggestion(suggestion.content)
                    setShowHelper(false)
                  }}
                  className="btn-primary text-sm w-full mt-2"
                >
                  ✅ Use This Suggestion
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              Click "Generate Suggestions" to get AI-powered ideas for your story!
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> The AI uses your current story context to generate relevant suggestions. 
            If the API is unavailable, you'll get high-quality fallback suggestions.
          </p>
        </div>
      </div>
    </div>
  )
}
