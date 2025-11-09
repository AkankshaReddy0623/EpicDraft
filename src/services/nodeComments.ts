import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface NodeComment {
  id?: string
  nodeId: string
  storyId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  reactions: { [emoji: string]: string[] } // emoji -> array of user IDs
  createdAt: any
  updatedAt: any
}

export interface NodeReaction {
  nodeId: string
  userId: string
  emoji: string
}

// Add comment to a node
export const addComment = async (
  nodeId: string,
  storyId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  content: string
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      throw new Error('Database not initialized')
    }

    await addDoc(collection(db, 'nodes', nodeId, 'comments'), {
      nodeId,
      storyId,
      userId,
      userName,
      userAvatar,
      content: content.trim(),
      reactions: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

// Subscribe to comments for a node
export const subscribeToComments = (
  nodeId: string,
  callback: (comments: NodeComment[]) => void
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return () => {}
    }

    const q = query(
      collection(db, 'nodes', nodeId, 'comments'),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NodeComment[]
      callback(comments)
    }, (error) => {
      console.error('Error subscribing to comments:', error)
      callback([])
    })
  } catch (error) {
    console.error('Error setting up comment subscription:', error)
    return () => {}
  }
}

// Add reaction to a comment
export const addCommentReaction = async (
  commentId: string,
  nodeId: string,
  userId: string,
  emoji: string
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return
    }

    const commentRef = doc(db, 'nodes', nodeId, 'comments', commentId)
    const commentDoc = await getDoc(commentRef)
    
    if (!commentDoc.exists()) return
    
    const commentData = commentDoc.data() as NodeComment
    const reactions = commentData.reactions || {}
    const userList = reactions[emoji] || []
    
    if (userList.includes(userId)) {
      // Remove reaction
      reactions[emoji] = userList.filter(id => id !== userId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      // Add reaction
      reactions[emoji] = [...userList, userId]
    }
    
    await updateDoc(commentRef, {
      reactions,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error adding comment reaction:', error)
    throw error
  }
}

// Add reaction to a node
export const addNodeReaction = async (
  nodeId: string,
  userId: string,
  emoji: string
) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return
    }

    const nodeRef = doc(db, 'nodes', nodeId)
    const nodeDoc = await getDoc(nodeRef)
    
    if (!nodeDoc.exists()) return
    
    const nodeData = nodeDoc.data()
    const reactions = nodeData.reactions || {}
    const userList = reactions[emoji] || []
    
    if (userList.includes(userId)) {
      // Remove reaction
      reactions[emoji] = userList.filter(id => id !== userId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      // Add reaction
      reactions[emoji] = [...userList, userId]
    }
    
    await updateDoc(nodeRef, {
      reactions,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error adding node reaction:', error)
    throw error
  }
}

// Delete comment
export const deleteComment = async (nodeId: string, commentId: string, userId: string) => {
  try {
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      return
    }

    const commentRef = doc(db, 'nodes', nodeId, 'comments', commentId)
    const commentDoc = await getDoc(commentRef)
    
    if (commentDoc.exists() && commentDoc.data().userId === userId) {
      await deleteDoc(commentRef)
    }
  } catch (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

