import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface StoryNode {
  id?: string
  storyId: string
  parentId?: string | null
  content: string
  authorId: string
  authorName: string
  votes: number
  voters: string[]
  createdAt: any
  isCanon: boolean
  order: number
}

export interface Story {
  id?: string
  title: string
  genre: string
  visibility: 'public' | 'private'
  ownerId: string
  ownerName: string
  description?: string
  starterPrompt?: string
  createdAt: any
  updatedAt: any
  contributors: string[]
  nodeCount: number
}

// Create a new story
export const createStory = async (storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'nodeCount'>) => {
  try {
    const storyRef = await addDoc(collection(db, 'stories'), {
      ...storyData,
      nodeCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    // Create initial root node if starter prompt exists
    if (storyData.starterPrompt) {
      await addDoc(collection(db, 'nodes'), {
        storyId: storyRef.id,
        parentId: null,
        content: storyData.starterPrompt,
        authorId: storyData.ownerId,
        authorName: storyData.ownerName,
        votes: 0,
        voters: [],
        isCanon: true,
        order: 0,
        createdAt: serverTimestamp(),
      })
      
      await updateDoc(doc(db, 'stories', storyRef.id), {
        nodeCount: 1,
      })
    }
    
    return storyRef.id
  } catch (error) {
    console.error('Error creating story:', error)
    throw error
  }
}

// Get all stories
export const getStories = async (userId?: string) => {
  try {
    let q = query(collection(db, 'stories'), orderBy('updatedAt', 'desc'))
    
    if (userId) {
      q = query(
        collection(db, 'stories'),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      )
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Story[]
  } catch (error) {
    console.error('Error getting stories:', error)
    throw error
  }
}

// Get a single story
export const getStory = async (storyId: string) => {
  try {
    const storyDoc = await getDoc(doc(db, 'stories', storyId))
    if (storyDoc.exists()) {
      return { id: storyDoc.id, ...storyDoc.data() } as Story
    }
    return null
  } catch (error) {
    console.error('Error getting story:', error)
    throw error
  }
}

// Subscribe to story updates
export const subscribeToStory = (storyId: string, callback: (story: Story | null) => void) => {
  return onSnapshot(doc(db, 'stories', storyId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Story)
    } else {
      callback(null)
    }
  })
}

// Create a story node
export const createNode = async (nodeData: Omit<StoryNode, 'id' | 'createdAt' | 'votes' | 'voters' | 'isCanon'>) => {
  try {
    // Get current node count for order
    const nodesQuery = query(
      collection(db, 'nodes'),
      where('storyId', '==', nodeData.storyId)
    )
    const nodesSnapshot = await getDocs(nodesQuery)
    const order = nodesSnapshot.size

    const nodeRef = await addDoc(collection(db, 'nodes'), {
      ...nodeData,
      votes: 0,
      voters: [],
      isCanon: false,
      order,
      createdAt: serverTimestamp(),
    })
    
    // Update story node count
    const storyRef = doc(db, 'stories', nodeData.storyId)
    await updateDoc(storyRef, {
      nodeCount: nodesSnapshot.size + 1,
      updatedAt: serverTimestamp(),
    })
    
    return nodeRef.id
  } catch (error) {
    console.error('Error creating node:', error)
    throw error
  }
}

// Get nodes for a story
export const getNodes = async (storyId: string) => {
  try {
    const q = query(
      collection(db, 'nodes'),
      where('storyId', '==', storyId),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StoryNode[]
  } catch (error) {
    console.error('Error getting nodes:', error)
    throw error
  }
}

// Subscribe to nodes updates
export const subscribeToNodes = (storyId: string, callback: (nodes: StoryNode[]) => void) => {
  const q = query(
    collection(db, 'nodes'),
    where('storyId', '==', storyId),
    orderBy('order', 'asc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const nodes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StoryNode[]
    callback(nodes)
  })
}

// Vote on a node
export const voteNode = async (nodeId: string, userId: string) => {
  try {
    const nodeRef = doc(db, 'nodes', nodeId)
    const nodeDoc = await getDoc(nodeRef)
    
    if (!nodeDoc.exists()) return
    
    const nodeData = nodeDoc.data() as StoryNode
    const hasVoted = nodeData.voters?.includes(userId) || false
    
    if (hasVoted) {
      // Remove vote
      await updateDoc(nodeRef, {
        votes: nodeData.votes - 1,
        voters: nodeData.voters.filter((v: string) => v !== userId),
      })
    } else {
      // Add vote
      await updateDoc(nodeRef, {
        votes: (nodeData.votes || 0) + 1,
        voters: [...(nodeData.voters || []), userId],
      })
    }
  } catch (error) {
    console.error('Error voting on node:', error)
    throw error
  }
}

// Mark node as canon
export const markNodeAsCanon = async (nodeId: string, storyId: string) => {
  try {
    const nodeRef = doc(db, 'nodes', nodeId)
    await updateDoc(nodeRef, {
      isCanon: true,
    })
    
    // Update story
    await updateDoc(doc(db, 'stories', storyId), {
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error marking node as canon:', error)
    throw error
  }
}

// Update node content
export const updateNode = async (nodeId: string, content: string) => {
  try {
    await updateDoc(doc(db, 'nodes', nodeId), {
      content,
    })
  } catch (error) {
    console.error('Error updating node:', error)
    throw error
  }
}

// Delete node
export const deleteNode = async (nodeId: string, storyId: string) => {
  try {
    await deleteDoc(doc(db, 'nodes', nodeId))
    
    // Update story node count
    const nodesQuery = query(
      collection(db, 'nodes'),
      where('storyId', '==', storyId)
    )
    const nodesSnapshot = await getDocs(nodesQuery)
    
    await updateDoc(doc(db, 'stories', storyId), {
      nodeCount: nodesSnapshot.size - 1,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error deleting node:', error)
    throw error
  }
}

