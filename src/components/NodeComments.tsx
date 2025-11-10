import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { subscribeToComments, addComment as addCommentToDb, Comment } from '../services/commentService'
import { useToast } from './ToastContainer'

interface NodeCommentsProps {
  nodeId: string
  storyId: string
}

const REACTIONS = ['👍', '❤️', '🎉', '🔥', '💡', '👏']

export default function NodeComments({ nodeId, storyId }: NodeCommentsProps) {
  const { user, addPoints, addXP, updateQuestProgress } = useApp()
  const { showToast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!nodeId || !expanded) return

    const unsubscribe = subscribeToComments(nodeId, (fetchedComments) => {
      setComments(fetchedComments)
    })

    return () => unsubscribe()
  }, [nodeId, expanded])

  useEffect(() => {
    if (expanded) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments, expanded])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim() || loading) return

    try {
      setLoading(true)
      await addCommentToDb({
        nodeId,
        storyId,
        userId: user.id,
        userName: user.name,
        content: newComment
      })
      setNewComment('')
      
      // Award points for commenting
      await addPoints(3)
      await addXP(5)
      updateQuestProgress('q9', 1) // Community Engager quest
      showToast('Comment added! +3 pts, +5 XP', 'success')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  // Simplified - no reactions or delete for now

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gold transition-colors flex items-center gap-1"
      >
        💬 {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </button>
    )
  }

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 animate-slide-in-right">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          💬 Comments ({comments.length})
        </h4>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar mb-3">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 animate-scale-in"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold">
                  {comment.userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                  {comment.userName}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {user && (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input-field flex-1 text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || loading}
            className="btn-primary text-sm px-4 disabled:opacity-50"
          >
            {loading ? '...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  )
}

