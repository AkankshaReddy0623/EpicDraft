// AI Analytics for quest verification and writing contributions
// This service analyzes user contributions to verify quest completion

export interface ContributionAnalysis {
  nodeCount: number
  plotTwistCount: number
  wordCount: number
  characterCount: number
  dialogueCount: number
  qualityScore: number
  engagementScore: number
}

export interface QuestVerification {
  questId: string
  verified: boolean
  progress: number
  evidence: string[]
  confidence: number
}

// Analyze a story node for quality and characteristics
export const analyzeNode = (content: string): ContributionAnalysis => {
  const words = content.trim().split(/\s+/).filter(w => w.length > 0)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const dialogueMatches = content.match(/["'"].*?["'"]/g) || []
  
  // Detect plot twists
  const plotTwistIndicators = [
    'twist', 'surprise', 'unexpected', 'reveal', 'secret', 'betrayal',
    'shock', 'suddenly', 'however', 'but then', 'revealed', 'discovered'
  ]
  const hasPlotTwist = plotTwistIndicators.some(indicator => 
    content.toLowerCase().includes(indicator)
  )
  
  // Quality scoring (simple heuristic)
  const qualityScore = Math.min(100, 
    (words.length > 50 ? 30 : words.length * 0.6) + // Length score
    (sentences.length > 3 ? 20 : sentences.length * 6) + // Structure score
    (dialogueMatches.length > 0 ? 20 : 0) + // Dialogue score
    (hasPlotTwist ? 15 : 0) + // Plot twist bonus
    (content.length > 200 ? 15 : content.length * 0.075) // Content depth
  )
  
  // Engagement score (based on variety and structure)
  const engagementScore = Math.min(100,
    (words.length > 100 ? 40 : words.length * 0.4) +
    (dialogueMatches.length * 10) +
    (hasPlotTwist ? 20 : 0) +
    (sentences.length > 5 ? 20 : sentences.length * 4)
  )
  
  return {
    nodeCount: 1,
    plotTwistCount: hasPlotTwist ? 1 : 0,
    wordCount: words.length,
    characterCount: content.length,
    dialogueCount: dialogueMatches.length,
    qualityScore: Math.round(qualityScore),
    engagementScore: Math.round(engagementScore),
  }
}

// Verify quest completion using AI analysis
export const verifyQuest = (
  questId: string,
  questType: string,
  questValue: number,
  userContributions: ContributionAnalysis[]
): QuestVerification => {
  const total = userContributions.reduce((acc, contrib) => ({
    nodeCount: acc.nodeCount + contrib.nodeCount,
    plotTwistCount: acc.plotTwistCount + contrib.plotTwistCount,
    wordCount: acc.wordCount + contrib.wordCount,
    characterCount: acc.characterCount + contrib.characterCount,
    dialogueCount: acc.dialogueCount + contrib.dialogueCount,
    qualityScore: acc.qualityScore + contrib.qualityScore,
    engagementScore: acc.engagementScore + contrib.engagementScore,
  }), {
    nodeCount: 0,
    plotTwistCount: 0,
    wordCount: 0,
    characterCount: 0,
    dialogueCount: 0,
    qualityScore: 0,
    engagementScore: 0,
  })
  
  let verified = false
  let progress = 0
  const evidence: string[] = []
  let confidence = 0
  
  switch (questType) {
    case 'write-node':
      progress = total.nodeCount
      verified = total.nodeCount >= questValue
      evidence.push(`${total.nodeCount} nodes written`)
      confidence = Math.min(100, (total.nodeCount / questValue) * 100)
      break
      
    case 'plot-twist':
      progress = total.plotTwistCount
      verified = total.plotTwistCount >= questValue
      evidence.push(`${total.plotTwistCount} plot twists detected`)
      confidence = Math.min(100, (total.plotTwistCount / questValue) * 100)
      break
      
    case 'upvoted-entry':
      // This would need vote data from elsewhere
      progress = 0
      verified = false
      evidence.push('Vote data required')
      confidence = 0
      break
      
    case 'character-appears':
      // Would need character tracking
      progress = 0
      verified = false
      evidence.push('Character tracking required')
      confidence = 0
      break
      
    default:
      progress = 0
      verified = false
      confidence = 0
  }
  
  if (total.qualityScore > 0) {
    evidence.push(`Average quality: ${Math.round(total.qualityScore / userContributions.length)}/100`)
  }
  
  return {
    questId,
    verified,
    progress: Math.min(progress, questValue),
    evidence,
    confidence: Math.round(confidence),
  }
}

// Analyze writing style and provide feedback
export const analyzeWritingStyle = (content: string) => {
  const words = content.trim().split(/\s+/)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
  
  const feedback: string[] = []
  const suggestions: string[] = []
  
  if (words.length < 50) {
    feedback.push('Consider expanding your content for more depth')
    suggestions.push('Add more descriptive details or dialogue')
  }
  
  if (avgWordsPerSentence > 25) {
    feedback.push('Some sentences are quite long')
    suggestions.push('Consider breaking long sentences into shorter ones for clarity')
  }
  
  if (avgWordsPerSentence < 8) {
    feedback.push('Sentences are quite short')
    suggestions.push('Try combining some sentences for better flow')
  }
  
  const dialogueCount = (content.match(/["'"].*?["'"]/g) || []).length
  if (dialogueCount === 0 && words.length > 100) {
    feedback.push('No dialogue detected')
    suggestions.push('Consider adding character dialogue to make it more engaging')
  }
  
  return {
    feedback,
    suggestions,
    stats: {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      dialogueCount,
    }
  }
}

