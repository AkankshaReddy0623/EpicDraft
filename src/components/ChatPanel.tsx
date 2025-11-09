import { useState, useEffect, useRef } from 'react'
import { subscribeToChat, sendMessage, ChatMessage } from '../services/chatService'
import { useApp } from '../context/AppContext'

interface ChatPanelProps {
  storyId: string
}

export default function ChatPanel({ storyId }: ChatPanelProps) {
  const { user } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!storyId) return

    const unsubscribe = subscribeToChat(storyId, (chatMessages) => {
      setMessages(chatMessages)
      scrollToBottom()
    })

    return () => unsubscribe()
  }, [storyId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || loading) return

    setLoading(true)
    try {
      await sendMessage(
        storyId,
        user.id,
        user.name,
        user.avatar,
        newMessage.trim()
      )
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${
                message.userId === user?.id ? 'flex-row-reverse' : ''
              }`}
            >
              {message.type === 'system' || message.type === 'achievement' ? (
                <div className="w-full text-center py-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {message.message}
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {message.userAvatar ? (
                      <img
                        src={message.userAvatar}
                        alt={message.userName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      message.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      message.userId === user?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {message.userName}
                    </span>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.userId === user?.id
                          ? 'bg-gold text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1 text-sm"
          disabled={loading || !user}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || loading || !user}
          className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}

