import { 
  doc, 
  setDoc, 
  onDisconnect, 
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
    const presenceRef = doc(db, 'stories', storyId, 'presence', userId)
    
    await setDoc(presenceRef, {
      userId,
      userName,
      userAvatar,
      storyId,
      isActive: true,
      lastSeen: serverTimestamp(),
    })
    
    // Set up disconnect handler
    onDisconnect(presenceRef).update({
      isActive: false,
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error setting presence:', error)
    throw error
  }
}

// Remove user presence
export const removePresence = async (storyId: string, userId: string) => {
  try {
    const presenceRef = doc(db, 'stories', storyId, 'presence', userId)
    await setDoc(presenceRef, {
      isActive: false,
      lastSeen: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error('Error removing presence:', error)
    throw error
  }
}

// Subscribe to presence updates
export const subscribeToPresence = (
  storyId: string,
  callback: (presences: Presence[]) => void
) => {
  const q = query(
    collection(db, 'stories', storyId, 'presence'),
    where('isActive', '==', true)
  )
  
  return onSnapshot(q, (snapshot) => {
    const presences = snapshot.docs.map(doc => ({
      ...doc.data(),
    })) as Presence[]
    callback(presences)
  })
}

