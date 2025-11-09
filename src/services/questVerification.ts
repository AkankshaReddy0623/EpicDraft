import { Quest } from '../types'
import { StoryNode } from './storyService'

// Verify quest completion based on user actions
export const verifyQuestCompletion = (
  quest: Quest,
  userStats: {
    totalNodesWritten: number
    totalVotesReceived: number
    streak: number
  },
  recentNodes: StoryNode[],
  userId: string
): { completed: boolean; progress: number } => {
  let progress = quest.progress
  let completed = quest.completed

  switch (quest.requirementType) {
    case 'write-node':
      // Count nodes written by this user
      const userNodes = recentNodes.filter(n => n.authorId === userId).length
      progress = Math.min(userNodes, quest.requirementValue)
      completed = progress >= quest.requirementValue
      break

    case 'plot-twist':
      // Check if user has written nodes with plot twist indicators
      const plotTwistNodes = recentNodes.filter(n => 
        n.authorId === userId && 
        (n.content.toLowerCase().includes('twist') || 
         n.content.toLowerCase().includes('surprise') ||
         n.content.toLowerCase().includes('unexpected'))
      ).length
      progress = Math.min(plotTwistNodes, quest.requirementValue)
      completed = progress >= quest.requirementValue
      break

    case 'upvoted-entry':
      // Count votes received by user's nodes
      const userNodeVotes = recentNodes
        .filter(n => n.authorId === userId)
        .reduce((sum, node) => sum + (node.votes || 0), 0)
      progress = Math.min(userNodeVotes, quest.requirementValue)
      completed = progress >= quest.requirementValue
      break

    case 'streak':
      progress = Math.min(userStats.streak, quest.requirementValue)
      completed = progress >= quest.requirementValue
      break

    case 'character-appears':
      // This would require more complex analysis
      progress = quest.progress
      completed = quest.completed
      break

    default:
      progress = quest.progress
      completed = quest.completed
  }

  return { completed, progress }
}

// Auto-verify quests when user performs actions
export const autoVerifyQuests = async (
  quests: Quest[],
  action: {
    type: 'node-created' | 'node-voted' | 'plot-twist' | 'streak-updated'
    userId: string
    node?: StoryNode
    votes?: number
  },
  userStats: {
    totalNodesWritten: number
    totalVotesReceived: number
    streak: number
  }
): Promise<Quest[]> => {
  return quests.map(quest => {
    if (quest.completed && quest.claimed) {
      return quest // Already completed and claimed
    }

    let newProgress = quest.progress
    let newCompleted = quest.completed

    switch (quest.requirementType) {
      case 'write-node':
        if (action.type === 'node-created') {
          newProgress = Math.min(quest.progress + 1, quest.requirementValue)
          newCompleted = newProgress >= quest.requirementValue
        }
        break

      case 'plot-twist':
        if (action.type === 'plot-twist' && action.node) {
          newProgress = Math.min(quest.progress + 1, quest.requirementValue)
          newCompleted = newProgress >= quest.requirementValue
        }
        break

      case 'upvoted-entry':
        if (action.type === 'node-voted' && action.votes) {
          newProgress = Math.min(quest.progress + action.votes, quest.requirementValue)
          newCompleted = newProgress >= quest.requirementValue
        }
        break

      case 'streak':
        if (action.type === 'streak-updated') {
          newProgress = Math.min(userStats.streak, quest.requirementValue)
          newCompleted = newProgress >= quest.requirementValue
        }
        break
    }

    return {
      ...quest,
      progress: newProgress,
      completed: newCompleted || quest.completed,
    }
  })
}

