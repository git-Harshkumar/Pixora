import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import Avatar from './Avatar'
import { formatDistanceToNow } from '../utils/time'
import { MessageCircle } from 'lucide-react'

const ChatSidebar = () => {
  const { conversations, fetchConversations } = useChatStore()
  const { userId } = useParams()

  useEffect(() => {
    fetchConversations()
  }, [])

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <MessageCircle size={40} strokeWidth={1.5} />
        <p className="text-sm font-medium">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-surface-border">
      {conversations.map(({ user, lastMessage, unreadCount }) => (
        <Link
          key={user.id}
          to={`/messages/${user.id}`}
          className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors
            ${userId === user.id ? 'bg-surface-elevated' : ''}`}
        >
          <div className="relative">
            <Avatar src={user.avatar} username={user.username} size="md" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-sm text-white truncate">{user.username}</p>
              {lastMessage && (
                <span className="text-xs text-gray-500 shrink-0">
                  {formatDistanceToNow(lastMessage.createdAt)}
                </span>
              )}
            </div>
            {lastMessage && (
              <p className={`text-xs truncate ${unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                {lastMessage.text}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ChatSidebar
