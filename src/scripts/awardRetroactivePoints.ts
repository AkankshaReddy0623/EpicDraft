import { collection, getDocs, doc, updateDoc, query, where, increment } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Award Retroactive Points Script
 * 
 * This script awards points and XP to users for nodes they created before
 * the point system was implemented. Run this once to backfill points.
 * 
 * Awards:
 * - 5 points per node
 * - 10 XP per node
 * 
 * Usage:
 * 1. Import this function in your app
 * 2. Call it from a button or console
 * 3. Check console for progress
 */

export const awardRetroactivePoints = async () => {
  console.log('🚀 Starting retroactive points award...')
  
  try {
    // Get all nodes
    const nodesSnapshot = await getDocs(collection(db, 'nodes'))
    console.log(`📝 Found ${nodesSnapshot.size} total nodes`)
    
    // Group nodes by author
    const nodesByAuthor = new Map<string, number>()
    
    nodesSnapshot.docs.forEach(doc => {
      const node = doc.data()
      if (node.authorId) {
        const count = nodesByAuthor.get(node.authorId) || 0
        nodesByAuthor.set(node.authorId, count + 1)
      }
    })
    
    console.log(`👥 Found ${nodesByAuthor.size} unique authors`)
    
    // Award points to each author
    let successCount = 0
    let errorCount = 0
    
    for (const [authorId, nodeCount] of nodesByAuthor.entries()) {
      try {
        const points = nodeCount * 5
        const xp = nodeCount * 10
        
        // Get user document
        const userRef = doc(db, 'users', authorId)
        
        // Update user with incremented points and XP
        await updateDoc(userRef, {
          points: increment(points),
          xp: increment(xp),
          totalNodesWritten: increment(nodeCount)
        })
        
        console.log(`✅ Awarded ${points} points and ${xp} XP to user ${authorId} (${nodeCount} nodes)`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to award points to user ${authorId}:`, error)
        errorCount++
      }
    }
    
    console.log('\n📊 Summary:')
    console.log(`✅ Successfully awarded: ${successCount} users`)
    console.log(`❌ Failed: ${errorCount} users`)
    console.log(`📝 Total nodes processed: ${nodesSnapshot.size}`)
    console.log('🎉 Retroactive points award complete!')
    
    return {
      success: successCount,
      failed: errorCount,
      totalNodes: nodesSnapshot.size,
      totalUsers: nodesByAuthor.size
    }
  } catch (error) {
    console.error('💥 Fatal error during retroactive points award:', error)
    throw error
  }
}

/**
 * Award points for specific user (useful for testing or individual fixes)
 */
export const awardRetroactivePointsForUser = async (userId: string) => {
  console.log(`🚀 Awarding retroactive points for user ${userId}...`)
  
  try {
    // Get all nodes by this user
    const q = query(collection(db, 'nodes'), where('authorId', '==', userId))
    const nodesSnapshot = await getDocs(q)
    
    const nodeCount = nodesSnapshot.size
    const points = nodeCount * 5
    const xp = nodeCount * 10
    
    if (nodeCount === 0) {
      console.log('⚠️ No nodes found for this user')
      return { nodeCount: 0, points: 0, xp: 0 }
    }
    
    // Update user
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      points: increment(points),
      xp: increment(xp),
      totalNodesWritten: increment(nodeCount)
    })
    
    console.log(`✅ Awarded ${points} points and ${xp} XP for ${nodeCount} nodes`)
    
    return { nodeCount, points, xp }
  } catch (error) {
    console.error('❌ Error awarding points:', error)
    throw error
  }
}

/**
 * Dry run - check what would be awarded without actually awarding
 */
export const dryRunRetroactivePoints = async () => {
  console.log('🔍 Running dry run (no changes will be made)...')
  
  try {
    const nodesSnapshot = await getDocs(collection(db, 'nodes'))
    const nodesByAuthor = new Map<string, number>()
    
    nodesSnapshot.docs.forEach(doc => {
      const node = doc.data()
      if (node.authorId) {
        const count = nodesByAuthor.get(node.authorId) || 0
        nodesByAuthor.set(node.authorId, count + 1)
      }
    })
    
    console.log('\n📊 Dry Run Results:')
    console.log(`Total nodes: ${nodesSnapshot.size}`)
    console.log(`Total users: ${nodesByAuthor.size}`)
    console.log('\nPoints to be awarded:')
    
    let totalPoints = 0
    let totalXP = 0
    
    for (const [authorId, nodeCount] of nodesByAuthor.entries()) {
      const points = nodeCount * 5
      const xp = nodeCount * 10
      totalPoints += points
      totalXP += xp
      console.log(`  User ${authorId}: ${nodeCount} nodes → ${points} points, ${xp} XP`)
    }
    
    console.log(`\nTotal to award: ${totalPoints} points, ${totalXP} XP`)
    console.log('✅ Dry run complete (no changes made)')
    
    return {
      totalNodes: nodesSnapshot.size,
      totalUsers: nodesByAuthor.size,
      totalPoints,
      totalXP
    }
  } catch (error) {
    console.error('❌ Error during dry run:', error)
    throw error
  }
}
