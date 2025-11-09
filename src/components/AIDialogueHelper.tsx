import { useState, useEffect } from 'react'
import { generateDialogueSuggestions, extractCharacters, CharacterContext, DialogueSuggestion } from '../services/aiDialogueHelper'

interface AIDialogueHelperProps {
  storyContent: string
  currentNodeContent: string
  onInsertDialogue: (dialogue: string) => void
}

export default function AIDialogueHelper({ storyContent, currentNodeContent, onInsertDialogue }: AIDialogueHelperProps) {
  const [suggestions, setSuggestions] = useState<DialogueSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<string>('')
  const [showHelper, setShowHelper] = useState(false)

  useEffect(() => {
    if (showHelper && currentNodeContent) {
      loadSuggestions()
    }
  }, [showHelper, currentNodeContent])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const characters = extractCharacters(currentNodeContent + ' ' + storyContent)
      if (characters.length === 0) {
        setSuggestions([])
        setLoading(false)
        return
      }

      const character = characters[0] // Use first character found
      setSelectedCharacter(character)

      const characterContext: CharacterContext = {
        name: character,
        personality: ['curious', 'brave'],
        relationships: {},
        currentSituation: currentNodeContent.substring(0, 200),
      }

      const dialogueSuggestions = await generateDialogueSuggestions(
        characterContext,
        currentNodeContent,
        []
      )

      setSuggestions(dialogueSuggestions)
    } catch (error) {
      console.error('Error generating dialogue suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!showHelper) {
    return (
      <button
        onClick={() => setShowHelper(true)}
        className="btn-secondary text-sm flex items-center gap-2"
      >
        <span>💬</span> AI Dialogue Helper
      </button>
    )
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <span>🤖</span> AI Dialogue Helper
        </h3>
        <button
          onClick={() => setShowHelper(false)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Generating suggestions...</p>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Suggested dialogue for <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedCharacter}</span>:
          </p>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
                    {suggestion.character}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "{suggestion.dialogue}"
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  suggestion.tone === 'humorous' ? 'bg-yellow-100 text-yellow-700' :
                  suggestion.tone === 'serious' ? 'bg-gray-100 text-gray-700' :
                  suggestion.tone === 'mysterious' ? 'bg-purple-100 text-purple-700' :
                  suggestion.tone === 'dramatic' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {suggestion.tone}
                </span>
              </div>
              <button
                onClick={() => {
                  onInsertDialogue(suggestion.dialogue)
                  setShowHelper(false)
                }}
                className="btn-primary text-xs w-full mt-2"
              >
                Insert Dialogue
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No characters detected. Add character names to get dialogue suggestions.
          </p>
        </div>
      )}

      <button
        onClick={loadSuggestions}
        className="btn-secondary text-xs w-full mt-3"
        disabled={loading}
      >
        {loading ? 'Generating...' : '🔄 Refresh Suggestions'}
      </button>
    </div>
  )
}

