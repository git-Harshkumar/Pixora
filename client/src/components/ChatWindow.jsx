import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Send, ArrowLeft } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { useSocketStore } from '../store/socketStore'
import { useAuthStore } from '../store/authStore'
import Avatar from './Avatar'
import TypingIndicator from './TypingIndicator'
import { formatDistanceToNow } from '../utils/time'

const ChatWindow = ({ userId, otherUser }) => {
  const { user } = useAuthStore()
  const { messages, fetchMessages } = useChatStore()
  const { sendMessage, startTyping, stopTyping } = useSocketStore()
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const threadMessages = messages[userId] || []

  useEffect(() => {
    fetchMessages(userId)
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages, partnerTyping])

  // Listen for typing indicators
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.senderId === userId) setPartnerTyping(data.typing)
    }
    // Wire up socket typing event listener
    const { socket } = useSocketStore.getState()
    socket?.on('typing:indicator', handleTyping)
    return () => socket?.off('typing:indicator', handleTyping)
  }, [userId])

  const handleInput = (e) => {
    setText(e.target.value)
    if (!isTyping) {
      setIsTyping(true)
      startTyping(userId)
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(userId)
    }, 1500)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(userId, text.trim())
    setText('')
    clearTimeout(typingTimeoutRef.current)
    setIsTyping(false)
    stopTyping(userId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border shrink-0">
        <Link to="/messages" className="md:hidden p-1.5 text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        {otherUser && (
          <>
            <Avatar src={otherUser.avatar} username={otherUser.username} size="sm" />
            <div>
              <Link to={`/profile/${otherUser.username}`} className="font-semibold text-sm text-white hover:underline">
                {otherUser.username}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {threadMessages.map((msg) => {
          const isMe = msg.sender.id === user?.id
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <Avatar src={msg.sender.avatar} username={msg.sender.username} size="xs" />}
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-surface-elevated border text-gray-200 rounded-bl-sm'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/60 text-right' : 'text-gray-500'}`}>
                  {formatDistanceToNow(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}

        {partnerTyping && (
          <TypingIndicator username={otherUser?.username} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
        <input
          type="text"
          placeholder="Message…"
          value={text}
          onChange={handleInput}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-brand-600 text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
