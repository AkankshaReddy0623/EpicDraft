import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { subscribeToComments, addComment, addCommentReaction, deleteComment, NodeComment } from '../services/nodeComments'

interface NodeCommentsProps {
  nodeId: string
  storyId: string
}

const REACTIONS = ['👍', '❤️', '🎉', '🔥', '💡', '👏']

export default function NodeComments({ nodeId, storyId }: NodeCommentsProps) {
  const { user, addPoints, addXP } = useApp()
  const [comments, setComments] = useState<NodeComment[]>([])
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
      await addComment(
        nodeId,
        storyId,
        user.id,
        user.name,
        user.avatar,
        newComment
      )
      setNewComment('')
      
      // Award points for commenting
      await addPoints(3) // +3 points for commenting
      await addXP(5) // +5 XP for commenting
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) return
    try {
      await addCommentReaction(commentId, nodeId, user.id, emoji)
      // Award points for reacting
      await addPoints(1) // +1 point for reacting
      await addXP(2) // +2 XP for reacting
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return
    try {
      await deleteComment(nodeId, commentId, user.id)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

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
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                    {comment.userName}
                  </span>
                </div>
                {comment.userId === user?.id && (
                  <button
                    onClick={() => comment.id && handleDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
                {comment.content}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {REACTIONS.map((emoji) => {
                  const users = comment.reactions?.[emoji] || []
                  const hasReacted = users.includes(user?.id || '')
                  return (
                    <button
                      key={emoji}
                      onClick={() => comment.id && handleReaction(comment.id, emoji)}
                      className={`text-xs px-2 py-1 rounded-full transition-all ${
                        hasReacted
                          ? 'bg-gold text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gold/20'
                      }`}
                    >
                      {emoji} {users.length > 0 && users.length}
                    </button>
                  )
                })}
              </div>
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

