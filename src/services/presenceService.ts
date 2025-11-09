import { 
  doc, 
  setDoc, 
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface Presence {
  userId: string
  userName: string
  userAvatar?: string
  storyId: string
  isActive: boolean
  lastSeen: any
}

// Set user presence in a story room
export const setPresence = async (
  storyId: string,
  userId: string,
  userName: string,
  userAvatar?: string
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      console.warn('Firestore not initialized, skipping presence')
      return
    }
    
    const presenceRef = doc(db, 'stories', storyId, 'presence', userId)
    
    await setDoc(presenceRef, {
      userId,
      userName,
      userAvatar,
      storyId,
      isActive: true,
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error setting presence:', error)
    // Don't throw - presence is not critical
  }
}

// Remove user presence
export const removePresence = async (storyId: string, userId: string) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      console.warn('Firestore not initialized, skipping presence removal')
      return
    }
    
    const presenceRef = doc(db, 'stories', storyId, 'presence', userId)
    await setDoc(presenceRef, {
      isActive: false,
      lastSeen: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error('Error removing presence:', error)
    // Don't throw - presence is not critical
  }
}

// Subscribe to presence updates
export const subscribeToPresence = (
  storyId: string,
  callback: (presences: Presence[]) => void
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      console.warn('Firestore not initialized, skipping presence subscription')
      return () => {} // Return empty unsubscribe function
    }
    
    const q = query(
      collection(db, 'stories', storyId, 'presence'),
      where('isActive', '==', true)
    )
    
    return onSnapshot(q, (snapshot) => {
      const presences = snapshot.docs.map(doc => ({
        ...doc.data(),
      })) as Presence[]
      callback(presences)
    }, (error) => {
      console.error('Presence subscription error:', error)
      callback([])
    })
  } catch (error) {
    console.error('Error setting up presence subscription:', error)
    return () => {} // Return empty unsubscribe function
  }
}
