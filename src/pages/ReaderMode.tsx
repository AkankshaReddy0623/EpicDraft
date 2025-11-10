import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getStory, getNodes, StoryNode, Story } from '../services/storyService'

export default function ReaderMode() {
  const { roomId } = useParams()
  const { user } = useApp()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [nodes, setNodes] = useState<StoryNode[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([]) // Array of node IDs representing current path
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return

    const loadStory = async () => {
      try {
        setLoading(true)
        const storyData = await getStory(roomId)
        if (!storyData) {
          setError('Story not found')
          setLoading(false)
          return
        }
        setStory(storyData)

        const storyNodes = await getNodes(roomId)
        setNodes(storyNodes)
        
        // Find the root node (no parent) - prefer canon, fallback to any root
        const rootNode = storyNodes.find(n => !n.parentId && n.isCanon) || 
                         storyNodes.find(n => !n.parentId)
        if (rootNode && rootNode.id) {
          setCurrentPath([rootNode.id])
        }
        
        setLoading(false)
      } catch (err: any) {
        // Handle offline errors gracefully
        if (err.message?.includes('offline') || err.code === 'unavailable') {
          console.warn('⚠️ Offline mode - using cached data')
          setError(null) // Don't show error, try to use cached data
        } else {
          setError(err.message || 'Failed to load story')
        }
        setLoading(false)
      }
    }

    loadStory()
  }, [roomId])

  const getCurrentNode = (): StoryNode | null => {
    if (currentPath.length === 0) return null
    const currentNodeId = currentPath[currentPath.length - 1]
    return nodes.find(n => n.id === currentNodeId) || null
  }

  const getChildNodes = (nodeId: string): StoryNode[] => {
    // Prefer canon children, but show all if no canon exists
    const canonChildren = nodes.filter(n => n.parentId === nodeId && n.isCanon)
    if (canonChildren.length > 0) {
      return canonChildren.sort((a, b) => (b.votes || 0) - (a.votes || 0)) // Sort by votes
    }
    // No canon children, show all children sorted by votes
    return nodes.filter(n => n.parentId === nodeId)
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
  }

  const navigateToNode = (nodeId: string) => {
    setCurrentPath([...currentPath, nodeId])
  }

  const goBack = () => {
    if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1))
    }
  }

  const resetStory = () => {
    const rootNode = nodes.find(n => !n.parentId && n.isCanon) || 
                     nodes.find(n => !n.parentId)
    if (rootNode && rootNode.id) {
      setCurrentPath([rootNode.id])
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading story...</p>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Story not found'}</p>
          <Link to="/home" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const currentNode = getCurrentNode()
  const childNodes = currentNode ? getChildNodes(currentNode.id || '') : []

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">{story.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{story.genre} • {nodes.length} nodes</p>
          </div>
          <div className="flex gap-3">
            {user && (
              <Link to={`/room/${roomId}`} className="btn-primary whitespace-nowrap">
                ✍️ Add Your Branch
              </Link>
            )}
            {!user && (
              <Link to="/login" className="btn-primary whitespace-nowrap">
                Sign In to Contribute
              </Link>
            )}
          </div>
        </div>

        {/* Story Content */}
        <div className="card mb-6 min-h-[400px]">
          {currentNode ? (
            <div className="space-y-6">
              {/* Story Path Breadcrumb */}
              {currentPath.length > 1 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <button onClick={resetStory} className="hover:text-gold transition-colors">
                    Start
                  </button>
                  {currentPath.slice(1, -1).map((nodeId, idx) => {
                    const node = nodes.find(n => n.id === nodeId)
                    return (
                      <span key={nodeId}>
                        <span className="mx-2">→</span>
                        <button
                          onClick={() => setCurrentPath(currentPath.slice(0, idx + 2))}
                          className="hover:text-gold transition-colors"
                        >
                          Chapter {idx + 1}
                        </button>
                      </span>
                    )
                  })}
                  <span className="mx-2">→</span>
                  <span className="text-gold font-semibold">Current</span>
                </div>
              )}

              {/* Current Node Content */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-l-4 border-gold">
                  <p className="text-lg leading-relaxed text-gray-900 dark:text-gray-50 whitespace-pre-wrap">
                    {currentNode.content}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      By {currentNode.authorName}
                    </span>
                    {currentNode.votes > 0 && (
                      <span className="text-sm text-gold font-semibold">
                        👍 {currentNode.votes} votes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentPath.length > 1 && (
                  <button onClick={goBack} className="btn-secondary">
                    ← Go Back
                  </button>
                )}
                {currentPath.length === 1 && (
                  <button onClick={resetStory} className="btn-secondary">
                    ↺ Restart Story
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Story Explorer</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                This story doesn't have any nodes yet. Be the first to contribute!
              </p>
              {user ? (
                <Link to={`/room/${roomId}`} className="btn-primary">
                  Start Writing
                </Link>
              ) : (
                <Link to="/login" className="btn-primary">
                  Sign In to Contribute
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Branch Options */}
        {currentNode && childNodes.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Choose Your Path ({childNodes.length} {childNodes.length === 1 ? 'option' : 'options'})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {childNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => navigateToNode(node.id || '')}
                  className="card bg-white dark:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all text-left border-2 border-transparent hover:border-gold cursor-pointer"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
                    {node.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      By {node.authorName}
                    </span>
                    {node.votes > 0 && (
                      <span className="text-xs text-gold font-semibold">
                        👍 {node.votes}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* End of Story */}
        {currentNode && childNodes.length === 0 && (
          <div className="card bg-gradient-to-br from-gold/10 to-gold-light/10 border-gold/30 text-center py-12">
            <div className="text-5xl mb-4">🏁</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
              End of This Path
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've reached the end of this story branch. Start over or contribute a new branch!
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={resetStory} className="btn-secondary">
                ↺ Restart Story
              </button>
              {user && (
                <Link to={`/room/${roomId}`} className="btn-primary">
                  Continue This Path
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
