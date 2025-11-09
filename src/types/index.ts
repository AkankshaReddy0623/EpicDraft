// User and Gamification Types

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  points: number
  xp: number
  level: number
  badges: string[]
  specialization?: SpecializationType
  streak: number
  lastContributionDate?: string
  totalNodesWritten?: number
  totalVotesReceived?: number
  totalStoriesCreated?: number
}

export interface PowerItem {
  id: string
  name: string
  cost: number
  description: string
  effectType: 'story-power' | 'character-upgrade' | 'cosmetic' | 'entry-boost' | 'mystery-box' | 'special-room'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  cooldown?: number // in hours
  category: string
  icon?: string
}

export interface InventoryItem {
  itemId: string
  item: PowerItem
  quantity: number
  acquiredAt: string
  usedAt?: string
}

export interface Character {
  id: string
  ownerId: string
  name: string
  level: number
  xp: number
  traits: string[]
  inventory: string[]
  createdAt: string
}

export interface Quest {
  id: string
  title: string
  description: string
  rewardPoints: number
  rewardXP: number
  requirementType: 'write-node' | 'plot-twist' | 'upvoted-entry' | 'streak' | 'character-appears' | 'custom'
  requirementValue: number
  completed: boolean
  claimed: boolean
  progress: number
}

export interface Badge {
  id: string
  title: string
  icon: string
  description: string
  requirementType: string
  requirementValue: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export type SpecializationType = 'plot-master' | 'world-builder' | 'character-crafter' | 'dialogue-whisperer' | null

export interface UserStats {
  level: number
  xp: number
  points: number
  badges: string[]
  specialization?: SpecializationType
  totalNodesWritten: number
  totalVotesReceived: number
  totalStoriesCreated: number
}

export interface MysteryBox {
  id: string
  name: string
  cost: number
  poolItems: PowerItem[]
}

