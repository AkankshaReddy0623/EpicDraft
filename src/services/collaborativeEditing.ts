import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface EditingSession {
  userId: string
  userName: string
  userAvatar?: string
  nodeId: string
  content: string
  lastEdit: any
}

// Subscribe to real-time edits for a node
export const subscribeToNodeEdits = (
  nodeId: string,
  callback: (edits: EditingSession[]) => void
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return () => {}
    }

    const editsRef = doc(db, 'nodeEdits', nodeId)
    return onSnapshot(editsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        const edits: EditingSession[] = Object.values(data.edits || {})
        callback(edits)
      } else {
        callback([])
      }
    }, (error) => {
      console.error('Error subscribing to node edits:', error)
      callback([])
    })
  } catch (error) {
    console.error('Error setting up edit subscription:', error)
    return () => {}
  }
}

// Update node content in real-time (debounced)
let debounceTimers: { [key: string]: NodeJS.Timeout } = {}

export const updateNodeContentRealtime = async (
  nodeId: string,
  userId: string,
  userName: string,
  content: string,
  userAvatar?: string,
  debounceMs: number = 1000
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return
    }

    // Clear existing timer
    if (debounceTimers[nodeId]) {
      clearTimeout(debounceTimers[nodeId])
    }

    // Set new timer
    debounceTimers[nodeId] = setTimeout(async () => {
      try {
        const editsRef = doc(db, 'nodeEdits', nodeId)
        await updateDoc(editsRef, {
          [`edits.${userId}`]: {
            userId,
            userName,
            userAvatar,
            nodeId,
            content,
            lastEdit: serverTimestamp(),
          },
          lastUpdated: serverTimestamp(),
        })
      } catch (error) {
        console.error('Error updating node content:', error)
      }
    }, debounceMs)
  } catch (error) {
    console.error('Error in updateNodeContentRealtime:', error)
  }
}

// Clear editing session when user leaves
export const clearEditingSession = async (nodeId: string, userId: string) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return
    }

    const editsRef = doc(db, 'nodeEdits', nodeId)
    await updateDoc(editsRef, {
      [`edits.${userId}`]: null,
    })
  } catch (error) {
    console.error('Error clearing editing session:', error)
  }
}

