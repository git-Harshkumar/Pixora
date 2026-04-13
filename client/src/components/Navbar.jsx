import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, Compass, PlusSquare, MessageCircle, LogOut, Search, X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Avatar from './Avatar'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearch, setMobileSearch] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileSearch(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-brand-400 shrink-0">
          Pixora
        </Link>

        {/* Search Bar — desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xs items-center gap-2 bg-surface-elevated border border-surface-border rounded-xl px-3 py-1.5"
        >
          <Search size={15} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}>
              <X size={13} className="text-gray-500 hover:text-white" />
            </button>
          )}
        </form>

        {/* Nav Icons */}
        <div className="flex items-center gap-1">
          <NavIcon to="/" icon={<Home size={22} />} label="Home" />
          <NavIcon to="/explore" icon={<Compass size={22} />} label="Explore" />
          <NavIcon to="/post/new" icon={<PlusSquare size={22} />} label="New Post" />
          <NavIcon to="/messages" icon={<MessageCircle size={22} />} label="Messages" />

          {/* Search Icon for mobile */}
          <button
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-elevated transition-all md:hidden"
            onClick={() => setMobileSearch((v) => !v)}
          >
            <Search size={22} />
          </button>

          {/* Profile Avatar */}
          <Link
            to={`/profile/${user?.username}`}
            className="ml-1 p-0.5"
          >
            <Avatar src={user?.avatar} username={user?.username} size="sm" />
          </Link>

          
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearch && (
        <div className="md:hidden px-4 pb-3 border-t border-surface-border pt-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-surface-elevated border border-surface-border rounded-xl px-3 py-2">
            <Search size={15} className="text-gray-500" />
            <input
              autoFocus
              type="text"
              placeholder="Search users…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
            />
          </form>
        </div>
      )}
    </nav>
  )
}

const NavIcon = ({ to, icon, label }) => (
  <Link
    to={to}
    title={label}
    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-elevated transition-all duration-200"
  >
    {icon}
  </Link>
)

export default Navbar