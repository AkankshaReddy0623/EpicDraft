import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface Comment {
  id?: string
  nodeId: string
  storyId: string
  userId: string
  userName: string
  content: string
  createdAt: any
}

// Add a comment to a node
export const addComment = async (comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const commentRef = await addDoc(collection(db, 'comments'), {
      ...comment,
      createdAt: serverTimestamp()
    })
    console.log('✅ Comment added:', commentRef.id)
    return commentRef.id
  } catch (error) {
    console.error('❌ Error adding comment:', error)
    throw error
  }
}

// Get all comments for a node
export const getComments = async (nodeId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('nodeId', '==', nodeId),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[]
  } catch (error) {
    console.error('Error getting comments:', error)
    return []
  }
}

// Subscribe to comments for real-time updates
export const subscribeToComments = (
  nodeId: string, 
  callback: (comments: Comment[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'comments'),
    where('nodeId', '==', nodeId),
    orderBy('createdAt', 'asc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[]
    callback(comments)
  })
}
