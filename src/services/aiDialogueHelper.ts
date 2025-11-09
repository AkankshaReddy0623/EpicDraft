// AI Character Dialogue Helper
// This is a placeholder for AI integration - can be connected to OpenAI, Anthropic, etc.

export interface DialogueSuggestion {
  character: string
  dialogue: string
  context: string
  tone: 'friendly' | 'serious' | 'mysterious' | 'humorous' | 'dramatic'
}

export interface CharacterContext {
  name: string
  personality: string[]
  relationships: { [characterName: string]: string }
  currentSituation: string
}

// Generate dialogue suggestions based on context
export const generateDialogueSuggestions = async (
  characterContext: CharacterContext,
  storyContext: string
): Promise<DialogueSuggestion[]> => {
  // This is a mock implementation
  // In production, this would call an AI API (OpenAI, Anthropic, etc.)
  
  const suggestions: DialogueSuggestion[] = [
    {
      character: characterContext.name,
      dialogue: generateMockDialogue(characterContext, storyContext),
      context: storyContext.substring(0, 100) + '...',
      tone: getRandomTone(),
    },
    {
      character: characterContext.name,
      dialogue: generateMockDialogue(characterContext, storyContext, true),
      context: storyContext.substring(0, 100) + '...',
      tone: getRandomTone(),
    },
  ]

  return suggestions
}

// Mock dialogue generation (replace with actual AI API call)
const generateMockDialogue = (
  character: CharacterContext,
  alternative: boolean = false
): string => {
  const templates = [
    `"I can't believe this is happening," ${character.name} said, their voice trembling.`,
    `${character.name} looked around nervously. "We need to be careful here."`,
    `"This changes everything," ${character.name} muttered, deep in thought.`,
    `${character.name} smiled. "I think I know what we should do next."`,
  ]

  if (alternative) {
    return templates[Math.floor(Math.random() * templates.length)]
  }

  return templates[0]
}

const getRandomTone = (): DialogueSuggestion['tone'] => {
  const tones: DialogueSuggestion['tone'][] = ['friendly', 'serious', 'mysterious', 'humorous', 'dramatic']
  return tones[Math.floor(Math.random() * tones.length)]
}

// Extract characters from story content
export const extractCharacters = (content: string): string[] => {
  // Simple regex-based extraction (can be improved with NLP)
  const namePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
  const matches = content.match(namePattern) || []
  return [...new Set(matches)].slice(0, 5) // Return up to 5 unique names
}

// Analyze dialogue tone
export const analyzeDialogueTone = (dialogue: string): DialogueSuggestion['tone'] => {
  const lowerDialogue = dialogue.toLowerCase()
  
  if (lowerDialogue.includes('!') || lowerDialogue.includes('haha') || lowerDialogue.includes('laugh')) {
    return 'humorous'
  }
  if (lowerDialogue.includes('?') || lowerDialogue.includes('wonder') || lowerDialogue.includes('think')) {
    return 'mysterious'
  }
  if (lowerDialogue.includes('must') || lowerDialogue.includes('need') || lowerDialogue.includes('important')) {
    return 'serious'
  }
  if (lowerDialogue.includes('love') || lowerDialogue.includes('happy') || lowerDialogue.includes('great')) {
    return 'friendly'
  }
  
  return 'dramatic'
}

