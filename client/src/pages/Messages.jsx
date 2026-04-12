import React from 'react'
import Navbar from '../components/Navbar'
import ChatSidebar from '../components/ChatSidebar'

const Messages = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-14">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
          <div className="card overflow-hidden">
            <ChatSidebar />
          </div>
        </div>
      </div>
    </>
  )
}

export default Messages
