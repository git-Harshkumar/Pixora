import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ChatSidebar from '../components/ChatSidebar'
import ChatWindow from '../components/ChatWindow'
import { useChatStore } from '../store/chatStore'
import { useSocketStore } from '../store/socketStore'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

const ChatThread = () => {
  const { userId } = useParams()
  const { user, token } = useAuthStore()
  const { receiveMessage, setCurrentUserId } = useChatStore()
  const { connect, disconnect } = useSocketStore()
  const [otherUser, setOtherUser] = useState(null)

  useEffect(() => {
    if (user) setCurrentUserId(user.id)
  }, [user])

  // Connect socket on mount
  useEffect(() => {
    if (token) {
      connect(token, receiveMessage, null)
    }
    return () => disconnect()
  }, [token])

  // Fetch other user info
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const { data } = await api.get(`/messages/${userId}`)
        setOtherUser(data.data.otherUser)
      } catch {}
    }
    fetchOtherUser()
  }, [userId])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-14">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="card overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="hidden md:flex md:w-72 flex-col border-r border-surface-border overflow-y-auto">
                <div className="px-4 py-3 border-b border-surface-border">
                  <h2 className="font-semibold text-white text-sm">Messages</h2>
                </div>
                <ChatSidebar />
              </div>

              {/* Chat Window */}
              <div className="flex-1 flex flex-col min-w-0">
                <ChatWindow userId={userId} otherUser={otherUser} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatThread
