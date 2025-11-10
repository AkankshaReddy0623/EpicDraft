import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { getStory, subscribeToStory, getNodes, subscribeToNodes, createNode, voteNode, StoryNode } from '../services/storyService'
import { setPresence, removePresence } from '../services/presenceService'
import { addNodeReaction } from '../services/nodeComments'
import { analyzeNode } from '../services/aiAnalytics'
import { useToast } from '../components/ToastContainer'
import ReactFlow, { Node, Edge, Background, Controls, MiniMap } from 'reactflow'
import ChatPanel from '../components/ChatPanel'
import PresenceIndicator from '../components/PresenceIndicator'
import AchievementPopup from '../components/AchievementPopup'
import Confetti from '../components/Confetti'
import ImprovedAIHelper from '../components/ImprovedAIHelper'
import NodeComments from '../components/NodeComments'
import 'reactflow/dist/style.css'

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, addPoints, addXP, updateStreak, inventory, updateQuestProgress } = useApp()
  const { showToast } = useToast()
  const [story, setStory] = useState<any>(null)
  const [nodes, setNodes] = useState<StoryNode[]>([])
  const [nodeContent, setNodeContent] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reactFlowNodes, setReactFlowNodes] = useState<Node[]>([])
  const [reactFlowEdges, setReactFlowEdges] = useState<Edge[]>([])
  const [showAchievement, setShowAchievement] = useState<{title: string, description: string, points?: number} | null>(null)
  const [confettiTrigger, setConfettiTrigger] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'contributors' | 'voting'>('chat')

  // Pre-calculate node analyses to avoid hooks in loops
  const nodeAnalyses = useMemo(() => {
    return nodes.reduce((acc, node) => {
      if (node.id) {
        acc[node.id] = analyzeNode(node.content)
      }
      return acc
    }, {} as Record<string, any>)
  }, [nodes])

  // Update React Flow graph when nodes change with better hierarchical layout
  const updateReactFlowGraph = useCallback((storyNodes: StoryNode[]) => {
    if (storyNodes.length === 0) {
      setReactFlowNodes([])
      setReactFlowEdges([])
      return
    }

    // Build a tree structure for better layout
    const nodeMap = new Map<string, StoryNode>()
    storyNodes.forEach(node => {
      if (node.id) nodeMap.set(node.id, node)
    })

    // Find root nodes (no parent or parent doesn't exist)
    const rootNodes = storyNodes.filter(n => !n.parentId || !nodeMap.has(n.parentId))
    
    // Calculate positions using hierarchical layout
    const positions = new Map<string, { x: number; y: number }>()
    const nodeLevels = new Map<string, number>()
    const levelNodes = new Map<number, StoryNode[]>()
    
    // Calculate levels (depth from root) - root is level 0, children increase
    const calculateLevel = (nodeId: string): number => {
      if (nodeLevels.has(nodeId)) return nodeLevels.get(nodeId)!
      
      const node = nodeMap.get(nodeId)
      if (!node) return 0
      
      // If no parent or parent doesn't exist, this is a root node (level 0)
      if (!node.parentId || !nodeMap.has(node.parentId)) {
        nodeLevels.set(nodeId, 0)
        return 0
      }
      
      // Children are one level below parent
      const parentLevel = calculateLevel(node.parentId)
      const myLevel = parentLevel + 1
      nodeLevels.set(nodeId, myLevel)
      return myLevel
    }

    storyNodes.forEach(node => {
      if (node.id) {
        const level = calculateLevel(node.id)
        if (!levelNodes.has(level)) levelNodes.set(level, [])
        levelNodes.get(level)!.push(node)
      }
    })

    // Assign positions
    levelNodes.forEach((nodes, level) => {
      const y = level * 200 + 50
      const spacing = 300
      const startX = -(nodes.length - 1) * spacing / 2
      nodes.forEach((node, index) => {
        if (node.id) {
          positions.set(node.id, {
            x: startX + index * spacing,
            y: y
          })
        }
      })
    })

    const flowNodes: Node[] = storyNodes.map((node) => {
      const pos = node.id ? positions.get(node.id) || { x: 0, y: 0 } : { x: 0, y: 0 }
      return {
        id: node.id || '',
        type: 'default',
        position: pos,
        data: {
          label: (
            <div className="p-2 max-w-[200px]">
              <div className="font-semibold mb-1 flex items-center gap-1">
                {node.isCanon && <span>⭐</span>}
                {node.authorName}
              </div>
              <div className="text-gray-600 dark:text-gray-400 line-clamp-2">{node.content.substring(0, 50)}...</div>
              <div className="text-xs text-gray-500 mt-1">{node.votes} votes</div>
            </div>
          )
        },
        style: {
          background: node.isCanon ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' : '#fff',
          border: node.isCanon ? '2px solid #ffa500' : '1px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: node.isCanon ? '0 4px 6px rgba(255, 215, 0, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        },
      }
    })

    const flowEdges: Edge[] = storyNodes
      .filter(node => node.parentId && node.id)
      .map(node => ({
        id: `e${node.parentId}-${node.id}`,
        source: node.parentId || '',
        target: node.id || '',
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: node.isCanon ? '#D4AF37' : '#999',
          strokeWidth: node.isCanon ? 3 : 2,
        },
        label: node.isCanon ? '⭐' : '',
        labelStyle: { fill: '#D4AF37', fontWeight: 600 },
      }))

    setReactFlowNodes(flowNodes)
    setReactFlowEdges(flowEdges)
  }, [])

  // Set presence when entering room
  useEffect(() => {
    if (!roomId || !user) return

    setPresence(roomId, user.id, user.name, user.avatar).catch(err => {
      console.warn('Failed to set presence:', err)
    })

    return () => {
      if (roomId && user) {
        removePresence(roomId, user.id).catch(err => {
          console.warn('Failed to remove presence:', err)
        })
      }
    }
  }, [roomId, user])

  // Load story and nodes with optimized loading
  useEffect(() => {
    if (!roomId) return

    let mounted = true
    let unsubscribeStory: (() => void) | null = null
    let unsubscribeNodes: (() => void) | null = null

    const loadStory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load story and nodes in parallel for faster loading
        const [storyData, initialNodes] = await Promise.all([
          getStory(roomId).catch(err => {
            console.warn('Error loading story:', err)
            return null
          }),
          getNodes(roomId).catch(err => {
            console.warn('Error loading nodes:', err)
            return []
          })
        ])
        
        if (!mounted) return
        
        if (!storyData) {
          setError('Story not found')
          setLoading(false)
          return
        }
        
        setStory(storyData)
        setNodes(initialNodes || [])
        updateReactFlowGraph(initialNodes || [])
        setLoading(false)

        // Subscribe to story updates (only if mounted)
        if (mounted) {
          unsubscribeStory = subscribeToStory(roomId, (updatedStory) => {
            if (mounted) setStory(updatedStory)
          })

          // Subscribe to nodes updates (only if mounted)
          unsubscribeNodes = subscribeToNodes(roomId, (updatedNodes) => {
            if (mounted) {
              setNodes(updatedNodes)
              updateReactFlowGraph(updatedNodes)
            }
          })
        }
      } catch (err: any) {
        if (mounted) {
          // Don't show offline errors as critical errors
          if (err.message?.includes('offline') || err.code === 'unavailable') {
            console.warn('Offline mode - using cached data')
            setError(null) // Clear error, use cached data
          } else {
            setError(err.message || 'Failed to load story')
          }
          setLoading(false)
        }
      }
    }

    loadStory()

    return () => {
      mounted = false
      if (unsubscribeStory) unsubscribeStory()
      if (unsubscribeNodes) unsubscribeNodes()
    }
  }, [roomId, updateReactFlowGraph])

  const handleSaveNode = async (isPlotTwist: boolean = false) => {
    if (!user || !roomId || !nodeContent.trim()) {
      setError('Please sign in and enter node content')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Validate content
      const trimmedContent = nodeContent.trim()
      if (trimmedContent.length < 10) {
        const errorMsg = 'Node content must be at least 10 characters long'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        setSaving(false)
        return
      }

      // Create the node with error handling
      let nodeId: string
      try {
        nodeId = await createNode({
          storyId: roomId,
          parentId: selectedParentId || null,
          content: trimmedContent,
          authorId: user.id,
          authorName: user.name,
        })
        console.log('✅ Node created successfully:', nodeId)
      } catch (createError: any) {
        console.error('❌ Error creating node:', createError)
        const errorMsg = createError.message || 'Failed to save node. Please check your connection and try again.'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        setSaving(false)
        return
      }

      // Verify node was created
      if (!nodeId) {
        const errorMsg = 'Node creation failed - no ID returned'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        setSaving(false)
        return
      }

      // Update user stats
      try {
        const { updateUserStats } = await import('../services/userService')
        await updateUserStats(user.id, { totalNodesWritten: 1 })
      } catch (statsError) {
        console.warn('Failed to update user stats:', statsError)
      }

      // Award points and XP with specialization bonuses
      let pointsEarned = isPlotTwist ? 10 : 5
      let xpEarned = isPlotTwist ? 15 : 10
      
      // Apply specialization bonuses (+50% XP for matching content)
      let bonusApplied = false
      if (user.specialization) {
        const content = trimmedContent.toLowerCase()
        
        if (user.specialization === 'plot-master' && isPlotTwist) {
          xpEarned = Math.floor(xpEarned * 1.5)
          bonusApplied = true
        } else if (user.specialization === 'dialogue-whisperer' && (content.includes('"') || content.includes("'"))) {
          xpEarned = Math.floor(xpEarned * 1.5)
          bonusApplied = true
        } else if (user.specialization === 'world-builder' && content.length > 200) {
          xpEarned = Math.floor(xpEarned * 1.5)
          bonusApplied = true
        } else if (user.specialization === 'character-crafter' && /\b(he|she|they|character|person)\b/i.test(content)) {
          xpEarned = Math.floor(xpEarned * 1.5)
          bonusApplied = true
        }
      }
      
      const oldLevel = user.level || 1
      const currentXP = user.xp || 0
      
      try {
        await addPoints(pointsEarned)
        await addXP(xpEarned)
        await updateStreak()
        
        // Update quest progress
        updateQuestProgress('q1', 1) // First Contribution quest
        if (isPlotTwist) {
          updateQuestProgress('q2', 1) // Plot Twister quest
        }
      } catch (pointsError) {
        console.warn('Failed to update points/XP:', pointsError)
        // Continue anyway - node was saved
      }

      // Check if leveled up
      const newLevel = Math.floor((currentXP + xpEarned) / 100) + 1
      if (newLevel > oldLevel) {
        setShowAchievement({
          title: `Level Up!`,
          description: `You've reached Level ${newLevel}!`,
          points: pointsEarned
        })
        setConfettiTrigger(true)
        setTimeout(() => setConfettiTrigger(false), 3000)
        showToast(`🎉 Level Up! You've reached Level ${newLevel}!`, 'achievement', 4000)
      } else {
        setShowAchievement({
          title: isPlotTwist ? 'Plot Twist Added!' : 'Node Saved!',
          description: `+${pointsEarned} points, +${xpEarned} XP`,
          points: pointsEarned
        })
        const bonusText = bonusApplied ? ' 🌟 Specialization Bonus!' : ''
        showToast(
          `${isPlotTwist ? '🎭 Plot Twist Added!' : '✅ Node Saved!'} +${pointsEarned} points, +${xpEarned} XP${bonusText}`,
          'success',
          3000
        )
      }

      setNodeContent('')
      setSelectedParentId(null)
    } catch (err: any) {
      console.error('Error saving node:', err)
      setError(err.message || 'Failed to save node. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleVote = useCallback(async (nodeId: string) => {
    if (!user || !roomId) return
    try {
      const node = nodes.find(n => n.id === nodeId)
      const hadVoted = node?.voters?.includes(user.id) || false
      
      await voteNode(nodeId, user.id)
      
      // Award points for voting (once per node)
      if (!hadVoted) {
        await addPoints(2) // +2 points for voting
        await addXP(3) // +3 XP for voting
        updateQuestProgress('q3', 1) // Popular Writer quest
        updateQuestProgress('q7', 1) // Active Voter quest
        showToast('Vote recorded! +2 points, +3 XP', 'success', 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to vote')
      showToast(err.message || 'Failed to vote', 'error')
    }
  }, [user, roomId, nodes, addPoints, addXP, updateQuestProgress])

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading story...</p>
        </div>
      </div>
    )
  }

  if (error && !story) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link to="/home" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card text-center max-w-md">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view this story room</p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{story?.title || 'Story Room'}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {story?.genre} • {story?.nodeCount || nodes.length} nodes • {story?.visibility}
            </p>
          </div>
          {roomId && user && <PresenceIndicator storyId={roomId} currentUserId={user.id} />}
        </div>
        <div className="flex gap-3">
          <Link 
            to={`/room/${roomId}/read`} 
            className="btn-secondary text-sm"
          >
            📖 Reader Mode
          </Link>
          <Link to="/home" className="btn-secondary text-sm">
            ← Back
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Story Graph */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-300">
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Story Branch Graph</h2>
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
              {reactFlowNodes.length > 0 ? (
                <ReactFlow
                  nodes={reactFlowNodes}
                  edges={reactFlowEdges}
                  fitView
                  className="bg-gray-50 dark:bg-gray-800"
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No nodes yet</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Create the first node to start the story!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Middle: Node Viewer + Editor */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto transition-colors duration-300">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Collaborative Node Editor</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="card">
              {nodes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    Parent Node (Optional) - Choose where to branch from
                  </label>
                  <select
                    className="input-field mb-4"
                    value={selectedParentId || ''}
                    onChange={(e) => setSelectedParentId(e.target.value || null)}
                  >
                    <option value="">Start new branch (root level)</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.isCanon ? '⭐ ' : ''}{node.content.substring(0, 50)}... by {node.authorName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    💡 Select any node to branch from that point. Canon nodes are marked with ⭐
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Your Story Node
                </label>
                <textarea
                  value={nodeContent}
                  onChange={(e) => setNodeContent(e.target.value)}
                  placeholder="Write your story node here... This will be a new branch in the story!"
                  className="input-field min-h-[200px] mb-2"
                />
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{nodeContent.length} characters</span>
                  <ImprovedAIHelper
                    storyContent={story?.description || story?.starterPrompt || ''}
                    currentNodeContent={nodeContent}
                    onInsertSuggestion={(text: string) => {
                      setNodeContent(prev => prev + '\n\n' + text)
                    }}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveNode(false)}
                  disabled={saving || !nodeContent.trim()}
                  className="game-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Node (+5 pts, +10 XP)'}
                </button>
                <button
                  onClick={() => handleSaveNode(true)}
                  disabled={saving || !nodeContent.trim()}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Add Twist (+10 pts, +15 XP)'}
                </button>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                💡 Writing a node earns 5 points and 10 XP. Adding a plot twist earns 10 points and 15 XP.
              </p>
            </div>

            {/* Existing Nodes */}
            {nodes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                  <span>📚</span> Story Nodes ({nodes.length})
                </h3>
                <div className="space-y-4">
                  {nodes.map((node) => {
                    const nodeAnalysis = node.id ? nodeAnalyses[node.id] : { wordCount: 0, qualityScore: 0 }
                    return (
                      <div
                        key={node.id}
                        className={`card transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                          node.isCanon 
                            ? 'border-2 border-gold bg-gradient-to-br from-gold/10 to-gold/5 animate-glow-pulse' 
                            : 'hover:border-gold/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                                {node.authorName}
                              </span>
                              {node.isCanon && (
                                <span className="text-xs bg-gold text-white px-2 py-0.5 rounded-full font-bold animate-pulse-gold">
                                  ⭐ Canon
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {nodeAnalysis.wordCount} words • Quality: {nodeAnalysis.qualityScore}/100
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {node.content}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleVote(node.id || '')}
                              className={`px-3 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                                node.voters?.includes(user?.id || '')
                                  ? 'bg-gold text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gold hover:text-white'
                              }`}
                            >
                              👍 {node.votes || 0}
                            </button>
                            
                            {/* Node Reactions */}
                            <div className="flex items-center gap-1">
                              {['❤️', '🔥', '💡'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={async () => {
                                    if (node.id && user) {
                                      try {
                                        await addNodeReaction(node.id, user.id, emoji)
                                        // Award points for reacting (+1 point, +2 XP)
                                        await addPoints(1)
                                        await addXP(2)
                                      } catch (err) {
                                        console.error('Error adding reaction:', err)
                                      }
                                    }
                                  }}
                                  className="text-lg hover:scale-125 transition-transform"
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {node.parentId && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Branch from: {nodes.find(n => n.id === node.parentId)?.authorName || 'Unknown'}
                            </p>
                          )}
                        </div>
                        
                        {/* Comments Section */}
                        {node.id && (
                          <NodeComments nodeId={node.id} storyId={roomId || ''} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Sidebar with Tabs */}
        <div className="w-80 bg-white dark:bg-gray-900 overflow-y-auto border-l border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="p-4">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'chat'
                    ? 'text-gold border-b-2 border-gold -mb-[2px]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveTab('contributors')}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'contributors'
                    ? 'text-gold border-b-2 border-gold -mb-[2px]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
                }`}
              >
                👥 Contributors
              </button>
              <button
                onClick={() => setActiveTab('voting')}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'voting'
                    ? 'text-gold border-b-2 border-gold -mb-[2px]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
                }`}
              >
                🗳️ Info
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === 'chat' && (
                <div className="animate-fade-in">
                  {roomId && <ChatPanel storyId={roomId} />}
                </div>
              )}
              
              {activeTab === 'contributors' && (
                <div className="animate-fade-in space-y-3">
                  {story?.contributors && story.contributors.length > 0 ? (
                    <>
                      <div className="card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30">
                        <p className="text-gray-900 dark:text-gray-50 font-semibold mb-1">
                          {story.contributors.length} Contributor{story.contributors.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Owner: <span className="font-semibold text-gold">{story.ownerName}</span>
                        </p>
                      </div>
                      <div className="card bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Story Stats:</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-700 dark:text-gray-300">📝 {story.nodeCount || 0} nodes</p>
                          <p className="text-gray-700 dark:text-gray-300">🌳 {nodes.length} total branches</p>
                          <p className="text-gray-700 dark:text-gray-300">⭐ {nodes.filter(n => n.isCanon).length} canon</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-8">No contributors yet</p>
                  )}
                </div>
              )}
              
              {activeTab === 'voting' && (
                <div className="animate-fade-in">
                  <div className="card bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">How Voting Works</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Vote on nodes to make them canon. The most voted branch becomes the main story path.
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="text-gold text-lg">⭐</span>
                        <span>Canon nodes are marked with a gold star</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold text-lg">👍</span>
                        <span>Click thumbs up to vote for a node</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold text-lg">🎯</span>
                        <span>Earn +2 points and +3 XP per vote</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold text-lg">🏆</span>
                        <span>Most voted nodes become canon</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievement Popup */}
      {showAchievement && (
        <AchievementPopup
          title={showAchievement.title}
          description={showAchievement.description}
          points={showAchievement.points}
          onClose={() => setShowAchievement(null)}
        />
      )}
      
      {/* Confetti */}
      <Confetti trigger={confettiTrigger} />
    </div>
  )
}
