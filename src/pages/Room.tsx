import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getStory, subscribeToStory, getNodes, subscribeToNodes, createNode, voteNode, StoryNode } from '../services/storyService'
import { setPresence, removePresence } from '../services/presenceService'
import ReactFlow, { Node, Edge, Background, Controls, MiniMap } from 'reactflow'
import ChatPanel from '../components/ChatPanel'
import PresenceIndicator from '../components/PresenceIndicator'
import AchievementPopup from '../components/AchievementPopup'
import Confetti from '../components/Confetti'
import 'reactflow/dist/style.css'

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, addPoints, addXP, updateStreak, inventory } = useApp()
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

  // Set presence when entering room
  useEffect(() => {
    if (!roomId || !user) return

    setPresence(roomId, user.id, user.name, user.avatar)

    return () => {
      if (roomId && user) {
        removePresence(roomId, user.id)
      }
    }
  }, [roomId, user])

  // Load story and nodes
  useEffect(() => {
    if (!roomId) return

    const loadStory = async () => {
      try {
        const storyData = await getStory(roomId)
        if (!storyData) {
          setError('Story not found')
          setLoading(false)
          return
        }
        setStory(storyData)
        setLoading(false)

        // Subscribe to story updates
        const unsubscribeStory = subscribeToStory(roomId, (updatedStory) => {
          setStory(updatedStory)
        })

        // Subscribe to nodes updates
        const unsubscribeNodes = subscribeToNodes(roomId, (updatedNodes) => {
          setNodes(updatedNodes)
          updateReactFlowGraph(updatedNodes)
        })

        return () => {
          unsubscribeStory()
          unsubscribeNodes()
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load story')
        setLoading(false)
      }
    }

    loadStory()
  }, [roomId])

  // Update React Flow graph when nodes change
  const updateReactFlowGraph = (storyNodes: StoryNode[]) => {
    const flowNodes: Node[] = storyNodes.map((node, index) => ({
      id: node.id || '',
      type: 'default',
      position: {
        x: (index % 3) * 250,
        y: Math.floor(index / 3) * 150,
      },
      data: {
        label: (
          <div className="p-2">
            <div className="text-xs font-semibold text-gold mb-1">
              {node.authorName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {node.content.substring(0, 50)}...
            </div>
            {node.isCanon && (
              <div className="text-xs text-gold font-bold mt-1">⭐ Canon</div>
            )}
          </div>
        ),
      },
      style: {
        background: node.isCanon ? '#D4AF37' : '#fff',
        border: node.isCanon ? '2px solid #B8941F' : '1px solid #EAEAEA',
        borderRadius: '8px',
        minWidth: '200px',
        color: node.isCanon ? '#fff' : '#1A1A1A',
      },
    }))

    const flowEdges: Edge[] = storyNodes
      .filter(node => node.parentId)
      .map(node => ({
        id: `e${node.parentId}-${node.id}`,
        source: node.parentId || '',
        target: node.id || '',
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: node.isCanon ? '#D4AF37' : '#999',
          strokeWidth: node.isCanon ? 3 : 1,
        },
      }))

    setReactFlowNodes(flowNodes)
    setReactFlowEdges(flowEdges)
    setLoading(false)
  }

  const handleSaveNode = async (isPlotTwist: boolean = false) => {
    if (!user || !roomId || !nodeContent.trim()) {
      setError('Please sign in and enter node content')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await createNode({
        storyId: roomId,
        parentId: selectedParentId,
        content: nodeContent,
        authorId: user.id,
        authorName: user.name,
      })

      // Award points and XP
      const pointsEarned = isPlotTwist ? 10 : 5
      const xpEarned = isPlotTwist ? 15 : 10
      
      const oldLevel = user.level
      await addPoints(pointsEarned)
      await addXP(xpEarned)
      await updateStreak()

      // Check if leveled up
      const newLevel = Math.floor((user.xp + xpEarned) / 100) + 1
      if (newLevel > oldLevel) {
        setShowAchievement({
          title: `Level Up!`,
          description: `You've reached Level ${newLevel}!`,
          points: pointsEarned
        })
        setConfettiTrigger(true)
        setTimeout(() => setConfettiTrigger(false), 3000)
      } else {
        setShowAchievement({
          title: isPlotTwist ? 'Plot Twist Added!' : 'Node Saved!',
          description: `+${pointsEarned} points, +${xpEarned} XP`,
          points: pointsEarned
        })
      }

      setNodeContent('')
      setSelectedParentId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save node')
    } finally {
      setSaving(false)
    }
  }

  const handleVote = async (nodeId: string) => {
    if (!user || !roomId) return
    try {
      await voteNode(nodeId, user.id, roomId)
    } catch (err: any) {
      setError(err.message || 'Failed to vote')
    }
  }

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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="card text-center max-w-md">
          <p className="text-text-lightSecondary dark:text-text-darkSecondary mb-4">Please sign in to view this story</p>
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
              {story?.genre} • {nodes.length} nodes
            </p>
          </div>
          {roomId && user && <PresenceIndicator storyId={roomId} currentUserId={user.id} />}
        </div>
        <div className="flex gap-3">
          <Link 
            to={`/room/${roomId}/read`} 
            className="btn-secondary text-sm"
          >
            Reader Mode
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Story Graph</h2>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Node Editor</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="card">
              {nodes.length > 0 && (
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">
                    Parent Node (Optional)
                  </label>
                  <select
                    className="input-field mb-4"
                    value={selectedParentId || ''}
                    onChange={(e) => setSelectedParentId(e.target.value || null)}
                  >
                    <option value="">Start new branch</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.content.substring(0, 50)}... by {node.authorName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <textarea
                value={nodeContent}
                onChange={(e) => setNodeContent(e.target.value)}
                placeholder="Write your story node here..."
                className="input-field min-h-[200px] mb-4"
              />
              
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Story Nodes</h3>
                <div className="space-y-3">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`card ${node.isCanon ? 'border-2 border-gold bg-gold/10' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                              {node.authorName}
                            </span>
                            {node.isCanon && (
                              <span className="text-xs bg-gold text-white px-2 py-0.5 rounded-full">Canon</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {node.content}
                          </p>
                        </div>
                        <button
                          onClick={() => handleVote(node.id || '')}
                          className="ml-4 px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gold hover:text-white rounded-lg transition-colors text-sm"
                        >
                          👍 {node.votes || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-900 overflow-y-auto border-l border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="p-4 space-y-6">
            <div className="h-[500px]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <span>💬</span> Chat
              </h3>
              {roomId && <ChatPanel storyId={roomId} />}
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <span>👥</span> Contributors
              </h3>
              <div className="space-y-2">
                {story?.contributors && story.contributors.length > 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {story.contributors.length} contributor(s)
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">No contributors yet</p>
                )}
              </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <span>🗳️</span> Voting
              </h3>
              <div className="card bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-4">Vote on nodes to make them canon</p>
              </div>
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
