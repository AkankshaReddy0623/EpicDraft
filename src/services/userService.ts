import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface UserData {
  id: string
  name: string
  email: string
  avatar?: string
  points: number
  xp: number
  level: number
  badges: string[]
  specialization?: string
  streak: number
  lastContributionDate?: string
  totalNodesWritten: number
  totalVotesReceived: number
  totalStoriesCreated: number
  createdAt: any
  updatedAt: any
}

// Get user data
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserData
    }
    return null
  } catch (error) {
    console.error('Error getting user data:', error)
    throw error
  }
}

// Create or update user data
export const setUserData = async (userId: string, userData: Partial<UserData>) => {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      })
    } else {
      await setDoc(userRef, {
        ...userData,
        points: 0,
        xp: 0,
        level: 1,
        badges: [],
        streak: 0,
        totalNodesWritten: 0,
        totalVotesReceived: 0,
        totalStoriesCreated: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('Error setting user data:', error)
    throw error
  }
}

// Update user points
export const updateUserPoints = async (userId: string, points: number) => {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0
      await updateDoc(userRef, {
        points: currentPoints + points,
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('Error updating user points:', error)
    throw error
  }
}

// Update user XP and level
export const updateUserXP = async (userId: string, xp: number) => {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const currentXP = userDoc.data().xp || 0
      const newXP = currentXP + xp
      const newLevel = Math.floor(newXP / 100) + 1
      
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('Error updating user XP:', error)
    throw error
  }
}

// Get leaderboard
export const getLeaderboard = async (limit: number = 10) => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('points', '>', 0)
    )
    const snapshot = await getDocs(usersQuery)
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UserData[]
    
    return users
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    throw error
  }
}

