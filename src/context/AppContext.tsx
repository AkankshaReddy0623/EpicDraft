import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth'
import { auth } from '../config/firebase'
import { getUserData, setUserData, updateUserPoints, updateUserXP } from '../services/userService'
import { User, PowerItem, InventoryItem, Quest, Badge, UserStats, SpecializationType } from '../types'

interface AppContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  inventory: InventoryItem[]
  quests: Quest[]
  badges: Badge[]
  storeItems: PowerItem[]
  stats: UserStats
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  addPoints: (amount: number) => Promise<void>
  addXP: (amount: number) => Promise<void>
  purchaseItem: (item: PowerItem) => Promise<boolean>
  useItem: (itemId: string) => void
  completeQuest: (questId: string) => void
  claimQuest: (questId: string) => void
  updateQuestProgress: (questId: string, progress: number) => void
  setSpecialization: (spec: SpecializationType) => Promise<void>
  updateStreak: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const initialStoreItems: PowerItem[] = [
  { id: 'sp1', name: 'Bonus Paragraph', cost: 50, description: 'Add an extra paragraph to your node', effectType: 'story-power', rarity: 'common', category: 'Story Powers', icon: '📝' },
  { id: 'sp2', name: 'Alternate Timeline', cost: 100, description: 'Propose an alternate timeline branch', effectType: 'story-power', rarity: 'rare', category: 'Story Powers', icon: '⏰' },
  { id: 'sp3', name: 'Override Vote', cost: 500, description: 'Override a vote once per story', effectType: 'story-power', rarity: 'epic', cooldown: 24, category: 'Story Powers', icon: '⚡' },
  { id: 'sp4', name: 'Revive Character', cost: 800, description: 'Bring back a dead character', effectType: 'story-power', rarity: 'epic', category: 'Story Powers', icon: '💀' },
  { id: 'sp5', name: 'Major Twist', cost: 1000, description: 'Introduce a major plot twist', effectType: 'story-power', rarity: 'legendary', category: 'Story Powers', icon: '🎭' },
  { id: 'eb1', name: 'Feature Node', cost: 100, description: 'Highlight your node in the story graph', effectType: 'entry-boost', rarity: 'common', category: 'Entry Boosts', icon: '⭐' },
  { id: 'eb2', name: 'Vote Boost', cost: 50, description: 'Get extra votes for your next node', effectType: 'entry-boost', rarity: 'common', category: 'Entry Boosts', icon: '🚀' },
  { id: 'eb3', name: 'Extended Visibility', cost: 150, description: 'Extend visibility during voting period', effectType: 'entry-boost', rarity: 'rare', category: 'Entry Boosts', icon: '👁️' },
  { id: 'cos1', name: 'Profile Theme', cost: 250, description: 'Unlock a custom theme for your profile', effectType: 'cosmetic', rarity: 'rare', category: 'Cosmetics', icon: '🎨' },
  { id: 'cos2', name: 'Title Border', cost: 150, description: 'Add a golden border to your profile title', effectType: 'cosmetic', rarity: 'common', category: 'Cosmetics', icon: '✨' },
  { id: 'cos3', name: 'Achievement Aura', cost: 500, description: 'Add a glowing aura around your name', effectType: 'cosmetic', rarity: 'epic', category: 'Cosmetics', icon: '🌟' },
  { id: 'mb1', name: 'Mystery Box', cost: 200, description: 'Random power card or item', effectType: 'mystery-box', rarity: 'rare', category: 'Mystery Boxes', icon: '🎁' },
]

const initialQuests: Quest[] = [
  { id: 'q1', title: 'First Contribution', description: 'Write your first story node', rewardPoints: 10, rewardXP: 20, requirementType: 'write-node', requirementValue: 1, completed: false, claimed: false, progress: 0 },
  { id: 'q2', title: 'Plot Twister', description: 'Add a plot twist to a story', rewardPoints: 15, rewardXP: 30, requirementType: 'plot-twist', requirementValue: 1, completed: false, claimed: false, progress: 0 },
  { id: 'q3', title: 'Popular Writer', description: 'Get 5 upvotes on your entries', rewardPoints: 25, rewardXP: 50, requirementType: 'upvoted-entry', requirementValue: 5, completed: false, claimed: false, progress: 0 },
  { id: 'q4', title: 'Week Warrior', description: 'Maintain a 7-day streak', rewardPoints: 50, rewardXP: 100, requirementType: 'streak', requirementValue: 7, completed: false, claimed: false, progress: 0 },
]

const initialBadges: Badge[] = [
  { id: 'b1', title: 'First Contribution', icon: '🎯', description: 'Made your first contribution', requirementType: 'write-node', requirementValue: 1, rarity: 'common' },
  { id: 'b2', title: 'Plot Master', icon: '🎭', description: 'Added 10 plot twists', requirementType: 'plot-twist', requirementValue: 10, rarity: 'rare' },
  { id: 'b3', title: 'Streak Master', icon: '🔥', description: '30-day contribution streak', requirementType: 'streak', requirementValue: 30, rarity: 'epic' },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  const [badges] = useState<Badge[]>(initialBadges)
  const [storeItems] = useState<PowerItem[]>(initialStoreItems)
  const [loading, setLoading] = useState(true)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        // Load user data from Firestore
        const userData = await getUserData(firebaseUser.uid)
        if (userData) {
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            points: userData.points || 0,
            xp: userData.xp || 0,
            level: userData.level || 1,
            badges: userData.badges || [],
            specialization: userData.specialization as SpecializationType,
            streak: userData.streak || 0,
            lastContributionDate: userData.lastContributionDate,
          })
        } else {
          // Create new user
          await setUserData(firebaseUser.uid, {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            points: 100, // Starting points
            xp: 0,
            level: 1,
            badges: [],
            streak: 0,
            totalNodesWritten: 0,
            totalVotesReceived: 0,
            totalStoriesCreated: 0,
          })
          
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            points: 100,
            xp: 0,
            level: 1,
            badges: [],
            streak: 0,
          })
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
      const { googleProvider } = await import('../config/firebase')
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setInventory([])
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const stats: UserStats = {
    level: user?.level || 1,
    xp: user?.xp || 0,
    points: user?.points || 0,
    badges: user?.badges || [],
    specialization: user?.specialization,
    totalNodesWritten: user ? (user as any).totalNodesWritten || 0 : 0,
    totalVotesReceived: user ? (user as any).totalVotesReceived || 0 : 0,
    totalStoriesCreated: user ? (user as any).totalStoriesCreated || 0 : 0,
  }

  const addPoints = async (amount: number) => {
    if (!user) return
    await updateUserPoints(user.id, amount)
    setUser({ ...user, points: user.points + amount })
  }

  const addXP = async (amount: number) => {
    if (!user) return
    await updateUserXP(user.id, amount)
    const newXP = user.xp + amount
    const newLevel = Math.floor(newXP / 100) + 1
    setUser({ ...user, xp: newXP, level: newLevel })
  }

  const purchaseItem = async (item: PowerItem): Promise<boolean> => {
    if (!user || user.points < item.cost) {
      return false
    }

    await updateUserPoints(user.id, -item.cost)
    setUser({ ...user, points: user.points - item.cost })
    
    const existingItem = inventory.find(inv => inv.itemId === item.id)
    if (existingItem) {
      setInventory(inventory.map(inv => 
        inv.itemId === item.id 
          ? { ...inv, quantity: inv.quantity + 1 }
          : inv
      ))
    } else {
      setInventory([...inventory, {
        itemId: item.id,
        item,
        quantity: 1,
        acquiredAt: new Date().toISOString(),
      }])
    }

    return true
  }

  const useItem = (itemId: string) => {
    const invItem = inventory.find(inv => inv.itemId === itemId)
    if (!invItem || invItem.quantity <= 0) return

    if (invItem.quantity === 1) {
      setInventory(inventory.filter(inv => inv.itemId !== itemId))
    } else {
      setInventory(inventory.map(inv =>
        inv.itemId === itemId
          ? { ...inv, quantity: inv.quantity - 1, usedAt: new Date().toISOString() }
          : inv
      ))
    }
  }

  const completeQuest = (questId: string) => {
    setQuests(quests.map(q =>
      q.id === questId ? { ...q, completed: true, progress: q.requirementValue } : q
    ))
  }

  const claimQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId)
    if (!quest || !quest.completed || quest.claimed) return

    await addPoints(quest.rewardPoints)
    await addXP(quest.rewardXP)
    setQuests(quests.map(q =>
      q.id === questId ? { ...q, claimed: true } : q
    ))
  }

  const updateQuestProgress = (questId: string, progress: number) => {
    setQuests(quests.map(q => {
      if (q.id === questId) {
        const newProgress = Math.min(progress, q.requirementValue)
        const completed = newProgress >= q.requirementValue && !q.completed
        return { ...q, progress: newProgress, completed: completed || q.completed }
      }
      return q
    }))
  }

  const setSpecialization = async (spec: SpecializationType) => {
    if (!user) return
    await setUserData(user.id, { specialization: spec })
    setUser({ ...user, specialization: spec })
  }

  const updateStreak = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const lastDate = user.lastContributionDate ? new Date(user.lastContributionDate).toISOString().split('T')[0] : null
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let newStreak = user.streak
    if (lastDate === today) {
      return
    } else if (lastDate === yesterday) {
      newStreak = user.streak + 1
    } else {
      newStreak = 1
    }

    await setUserData(user.id, { 
      streak: newStreak, 
      lastContributionDate: today 
    })
    setUser({ ...user, streak: newStreak, lastContributionDate: today })
  }

  return (
    <AppContext.Provider value={{
      user,
      firebaseUser,
      inventory,
      quests,
      badges,
      storeItems,
      stats,
      loading,
      signIn,
      signOut: handleSignOut,
      setUser,
      addPoints,
      addXP,
      purchaseItem,
      useItem,
      completeQuest,
      claimQuest,
      updateQuestProgress,
      setSpecialization,
      updateStreak,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
