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
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Simple in-memory cache to reduce Firestore reads
const storyCache = new Map<string, { data: Story, timestamp: number }>()
const nodesCache = new Map<string, { data: StoryNode[], timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

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
    // Check if db is initialized
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      throw new Error('Database not initialized')
    }

    // Create the story document
    const storyRef = await addDoc(collection(db, 'stories'), {
      title: storyData.title,
      genre: storyData.genre,
      visibility: storyData.visibility,
      ownerId: storyData.ownerId,
      ownerName: storyData.ownerName,
      description: storyData.description || '',
      starterPrompt: storyData.starterPrompt || '',
      contributors: storyData.contributors || [storyData.ownerId],
      nodeCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    console.log('Story created with ID:', storyRef.id)
    
    // Update user's totalStoriesCreated count
    try {
      const { updateUserStats } = await import('./userService')
      await updateUserStats(storyData.ownerId, { totalStoriesCreated: 1 })
    } catch (err) {
      console.warn('Failed to update user stats:', err)
    }
    
    // Create initial root node if starter prompt exists
    if (storyData.starterPrompt && storyData.starterPrompt.trim()) {
      try {
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
          updatedAt: serverTimestamp(),
        })
        
        console.log('Root node created for story:', storyRef.id)
      } catch (nodeError) {
        console.error('Error creating root node:', nodeError)
        // Don't throw - story was created successfully
      }
    }
    
    return storyRef.id
  } catch (error: any) {
    console.error('Error creating story:', error)
    throw new Error(error.message || 'Failed to create story. Please try again.')
  }
}

// Get all stories with optional limit for performance
export const getStories = async (userId?: string, limitCount?: number) => {
  try {
    let q
    
    if (userId) {
      // Get user's stories (both public and private)
      q = limitCount
        ? query(
            collection(db, 'stories'),
            where('ownerId', '==', userId),
            orderBy('updatedAt', 'desc'),
            limit(limitCount)
          )
        : query(
            collection(db, 'stories'),
            where('ownerId', '==', userId),
            orderBy('updatedAt', 'desc')
          )
    } else {
      // Get all public stories with optional limit
      q = limitCount
        ? query(
            collection(db, 'stories'),
            where('visibility', '==', 'public'),
            orderBy('updatedAt', 'desc'),
            limit(limitCount)
          )
        : query(
            collection(db, 'stories'),
            where('visibility', '==', 'public'),
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

// Get a single story with offline support and caching
export const getStory = async (storyId: string) => {
  try {
    // Check cache first
    const cached = storyCache.get(storyId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached story data')
      return cached.data
    }

    const storyDoc = await getDoc(doc(db, 'stories', storyId))
    if (storyDoc.exists()) {
      const story = { id: storyDoc.id, ...storyDoc.data() } as Story
      // Cache the result
      storyCache.set(storyId, { data: story, timestamp: Date.now() })
      return story
    }
    return null
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('client is offline')) {
      console.warn('⚠️ Operating in offline mode - using cached/local data')
      // Return cached data if available
      const cached = storyCache.get(storyId)
      if (cached) {
        return cached.data
      }
      // Try to get from Firestore cache
      try {
        const storyDoc = await getDoc(doc(db, 'stories', storyId))
        if (storyDoc.exists()) {
          return { id: storyDoc.id, ...storyDoc.data() } as Story
        }
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError)
      }
    }
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
    // Check if db is initialized
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      throw new Error('Database not initialized')
    }

    // Validate required fields
    if (!nodeData.storyId || !nodeData.content || !nodeData.authorId || !nodeData.authorName) {
      throw new Error('Missing required node data')
    }

    // Get current node count for order
    const nodesQuery = query(
      collection(db, 'nodes'),
      where('storyId', '==', nodeData.storyId)
    )
    const nodesSnapshot = await getDocs(nodesQuery)
    const order = nodesSnapshot.size

    // Create the node
    const nodeRef = await addDoc(collection(db, 'nodes'), {
      storyId: nodeData.storyId,
      parentId: nodeData.parentId || null,
      content: nodeData.content.trim(),
      authorId: nodeData.authorId,
      authorName: nodeData.authorName,
      votes: 0,
      voters: [],
      isCanon: false,
      order,
      reactions: {},
      createdAt: serverTimestamp(),
    })
    
    console.log('✅ Node document created with ID:', nodeRef.id)
    
    // Update story node count and contributors
    const storyRef = doc(db, 'stories', nodeData.storyId)
    const storyDoc = await getDoc(storyRef)
    
    if (storyDoc.exists()) {
      const storyData = storyDoc.data()
      const contributors = storyData.contributors || []
      const updatedContributors = contributors.includes(nodeData.authorId)
        ? contributors
        : [...contributors, nodeData.authorId]
      
      await updateDoc(storyRef, {
        nodeCount: increment(1),
        contributors: updatedContributors,
        updatedAt: serverTimestamp(),
      })
      
      // Invalidate cache
      storyCache.delete(nodeData.storyId)
      nodesCache.delete(nodeData.storyId)
      
      console.log('✅ Story updated with new node count')
    }
    
    return nodeRef.id
  } catch (error: any) {
    console.error('❌ Error creating node:', error)
    throw new Error(error.message || 'Failed to create node. Please try again.')
  }
}

// Get nodes for a story with offline support and caching
export const getNodes = async (storyId: string) => {
  try {
    // Check cache first
    const cached = nodesCache.get(storyId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached nodes data')
      return cached.data
    }

    const q = query(
      collection(db, 'nodes'),
      where('storyId', '==', storyId),
      orderBy('order', 'asc')
    )
    const snapshot = await getDocs(q)
    const nodes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StoryNode[]
    
    // Cache the result
    nodesCache.set(storyId, { data: nodes, timestamp: Date.now() })
    return nodes
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('client is offline')) {
      console.warn('⚠️ Operating in offline mode - using cached/local data')
      // Return cached data if available
      const cached = nodesCache.get(storyId)
      if (cached) {
        return cached.data
      }
      // Try to get from Firestore cache
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
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError)
        return [] // Return empty array instead of throwing
      }
    }
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
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      throw new Error('Database not initialized')
    }

    const nodeRef = doc(db, 'nodes', nodeId)
    const nodeDoc = await getDoc(nodeRef)
    
    if (!nodeDoc.exists()) {
      throw new Error('Node not found')
    }
    
    const nodeData = nodeDoc.data() as StoryNode
    const voters = nodeData.voters || []
    const hasVoted = voters.includes(userId)
    
    if (hasVoted) {
      // Remove vote
      await updateDoc(nodeRef, {
        votes: Math.max(0, (nodeData.votes || 0) - 1),
        voters: voters.filter((v: string) => v !== userId),
        updatedAt: serverTimestamp(),
      })
    } else {
      // Add vote
      await updateDoc(nodeRef, {
        votes: (nodeData.votes || 0) + 1,
        voters: [...voters, userId],
        updatedAt: serverTimestamp(),
      })
      
      // Check if this node should become canon (highest votes)
      // This would ideally be done in a cloud function, but for now we'll track it
    }
  } catch (error: any) {
    console.error('Error voting on node:', error)
    throw new Error(error.message || 'Failed to vote on node')
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

