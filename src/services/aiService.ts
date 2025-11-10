// AI Service for story suggestions and analysis
// This uses a free AI API (Hugging Face Inference API) for generating suggestions

export interface AISuggestion {
  type: 'dialogue' | 'plot' | 'description' | 'character'
  content: string
  confidence: number
}

// Free Hugging Face API endpoint (no API key required for basic usage)
const HF_API_URL = 'https://api-inference.huggingface.co/models/gpt2'

/**
 * Generate story suggestions using AI
 * Falls back to rule-based suggestions if API fails
 */
export async function generateStorySuggestions(
  context: string,
  type: 'dialogue' | 'plot' | 'description' | 'character' = 'dialogue'
): Promise<AISuggestion[]> {
  try {
    // Try AI API first (with timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const prompt = buildPrompt(context, type)
    
    try {
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.8,
            top_p: 0.9,
            num_return_sequences: 3,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return parseAIResponse(data, type)
      }
    } catch (fetchError) {
      console.warn('AI API failed, using fallback:', fetchError)
    }

    // Fallback to rule-based suggestions
    return generateFallbackSuggestions(context, type)
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return generateFallbackSuggestions(context, type)
  }
}

/**
 * Build a prompt for the AI model
 */
function buildPrompt(context: string, type: string): string {
  const contextSnippet = context.substring(0, 200)
  
  switch (type) {
    case 'dialogue':
      return `Write a natural dialogue line for this story scene: ${contextSnippet}\nDialogue:`
    case 'plot':
      return `Suggest an interesting plot twist for this story: ${contextSnippet}\nPlot twist:`
    case 'description':
      return `Write a vivid description for this scene: ${contextSnippet}\nDescription:`
    case 'character':
      return `Describe a character action in this scene: ${contextSnippet}\nAction:`
    default:
      return `Continue this story: ${contextSnippet}\nNext:`
  }
}

/**
 * Parse AI API response
 */
function parseAIResponse(data: any, type: 'dialogue' | 'plot' | 'description' | 'character'): AISuggestion[] {
  try {
    if (Array.isArray(data)) {
      return data.slice(0, 3).map((item, index) => ({
        type,
        content: cleanAIText(item.generated_text || ''),
        confidence: 0.9 - (index * 0.1),
      }))
    }
    return []
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return []
  }
}

/**
 * Clean AI-generated text
 */
function cleanAIText(text: string): string {
  // Remove the prompt from the response
  const lines = text.split('\n')
  const relevantLines = lines.slice(1).filter(line => line.trim().length > 0)
  return relevantLines.join(' ').trim().substring(0, 200)
}

/**
 * Generate rule-based fallback suggestions
 */
function generateFallbackSuggestions(context: string, type: string): AISuggestion[] {
  const suggestions: AISuggestion[] = []

  switch (type) {
    case 'dialogue':
      suggestions.push(
        { type: 'dialogue', content: '"I never expected things to turn out this way," they said softly.', confidence: 0.7 },
        { type: 'dialogue', content: '"We need to act quickly before it\'s too late!"', confidence: 0.7 },
        { type: 'dialogue', content: '"There\'s something you should know about what happened..."', confidence: 0.7 }
      )
      break
    case 'plot':
      suggestions.push(
        { type: 'plot', content: 'A mysterious figure from the past suddenly reappears, changing everything.', confidence: 0.7 },
        { type: 'plot', content: 'The protagonist discovers a hidden truth that challenges their beliefs.', confidence: 0.7 },
        { type: 'plot', content: 'An unexpected alliance forms between former enemies.', confidence: 0.7 }
      )
      break
    case 'description':
      suggestions.push(
        { type: 'description', content: 'The atmosphere was thick with tension, every shadow seeming to hold secrets.', confidence: 0.7 },
        { type: 'description', content: 'Moonlight filtered through the windows, casting eerie patterns on the floor.', confidence: 0.7 },
        { type: 'description', content: 'The room fell silent, broken only by the distant sound of footsteps.', confidence: 0.7 }
      )
      break
    case 'character':
      suggestions.push(
        { type: 'character', content: 'They hesitated for a moment, then made a decision that would change everything.', confidence: 0.7 },
        { type: 'character', content: 'With determined eyes, they stepped forward into the unknown.', confidence: 0.7 },
        { type: 'character', content: 'A subtle smile crossed their face as they realized the truth.', confidence: 0.7 }
      )
      break
  }

  return suggestions
}

/**
 * Analyze story node quality
 */
export function analyzeNodeQuality(content: string): {
  wordCount: number
  qualityScore: number
  suggestions: string[]
} {
  const words = content.trim().split(/\s+/)
  const wordCount = words.length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1)
  
  let qualityScore = 50 // Base score
  const suggestions: string[] = []

  // Length scoring
  if (wordCount >= 50 && wordCount <= 300) {
    qualityScore += 20
  } else if (wordCount < 30) {
    suggestions.push('Consider adding more detail to your node')
    qualityScore -= 10
  } else if (wordCount > 500) {
    suggestions.push('Consider breaking this into multiple nodes')
  }

  // Sentence variety
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    qualityScore += 15
  }

  // Dialogue detection
  if (content.includes('"') || content.includes("'")) {
    qualityScore += 10
  }

  // Descriptive language
  const descriptiveWords = ['beautiful', 'dark', 'mysterious', 'ancient', 'gleaming', 'shadowy']
  const hasDescriptive = descriptiveWords.some(word => content.toLowerCase().includes(word))
  if (hasDescriptive) {
    qualityScore += 5
  }

  // Cap at 100
  qualityScore = Math.min(100, Math.max(0, qualityScore))

  if (qualityScore < 60) {
    suggestions.push('Try adding more vivid descriptions or dialogue')
  }

  return { wordCount, qualityScore, suggestions }
}

/**
 * Extract character names from text
 */
export function extractCharacters(text: string): string[] {
  // Simple regex to find capitalized words that might be names
  const words = text.match(/\b[A-Z][a-z]+\b/g) || []
  const uniqueNames = [...new Set(words)]
  
  // Filter out common words that aren't names
  const commonWords = ['The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'Of', 'And', 'But', 'Or', 'As', 'If', 'When', 'Where', 'Why', 'How', 'What', 'Which', 'Who', 'Whom', 'This', 'That', 'These', 'Those']
  return uniqueNames.filter(name => !commonWords.includes(name)).slice(0, 5)
}
