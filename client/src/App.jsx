import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import NewPost from './pages/NewPost'
import Messages from './pages/Messages'
import ChatThread from './pages/ChatThread'

// Protected route wrapper
const Protected = ({ children }) => {
  const { user, token } = useAuthStore()
  if (!user || !token) return <Navigate to="/login" replace />
  return children
}

// Public-only route (redirect if already logged in)
const PublicOnly = ({ children }) => {
  const { user, token } = useAuthStore()
  if (user && token) return <Navigate to="/" replace />
  return children
}

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#111118',
            color: '#fff',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#73e1d0ca', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        {/* Protected Routes */}
        <Route path="/" element={<Protected><Feed /></Protected>} />
        <Route path="/explore" element={<Protected><Explore /></Protected>} />
        <Route path="/profile/:username" element={<Protected><Profile /></Protected>} />
        <Route path="/post/new" element={<Protected><NewPost /></Protected>} />
        <Route path="/messages" element={<Protected><Messages /></Protected>} />
        <Route path="/messages/:userId" element={<Protected><ChatThread /></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
