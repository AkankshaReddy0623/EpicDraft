import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface ChatMessage {
  id?: string
  storyId: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  createdAt: any
  type?: 'message' | 'system' | 'achievement'
}

// Send a chat message
export const sendMessage = async (
  storyId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  message: string
) => {
  try {
    await addDoc(collection(db, 'stories', storyId, 'chat'), {
      storyId,
      userId,
      userName,
      userAvatar,
      message,
      type: 'message',
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Subscribe to chat messages
export const subscribeToChat = (
  storyId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(db, 'stories', storyId, 'chat'),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[]
    callback(messages.reverse()) // Reverse to show oldest first
  })
}

// Send system message (e.g., user joined, achievement unlocked)
export const sendSystemMessage = async (
  storyId: string,
  message: string,
  type: 'system' | 'achievement' = 'system'
) => {
  try {
    await addDoc(collection(db, 'stories', storyId, 'chat'), {
      storyId,
      userId: 'system',
      userName: 'System',
      message,
      type,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error sending system message:', error)
    throw error
  }
}

