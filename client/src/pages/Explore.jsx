import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import { useAuthStore } from '../store/authStore'

const Explore = () => {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { user } = useAuthStore()

  const handleSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      // Search by username — using the get profile endpoint
      const { data } = await api.get(`/users/${q.trim()}`)
      setResults(data.data.user ? [data.data.user] : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-14">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-white mb-4">Explore</h1>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <div className="flex-1 flex items-center gap-2 bg-surface-card border border-surface-border rounded-xl px-4 py-2.5">
              <Search size={16} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by username…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
                id="explore-search"
              />
            </div>
            <button type="submit" className="btn-primary px-5">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Results */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-brand-500" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium text-white">No users found</p>
              <p className="text-sm mt-1">Try a different username</p>
            </div>
          )}

          {!loading && results.map((u) => (
            <Link
              key={u.id}
              to={`/profile/${u.username}`}
              className="card flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors"
            >
              <Avatar src={u.avatar} username={u.username} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{u.username}</p>
                {u.bio && <p className="text-sm text-gray-400 truncate mt-0.5">{u.bio}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {u._count?.followers ?? 0} followers · {u._count?.posts ?? 0} posts
                </p>
              </div>
              {u.id !== user?.id && (
                <FollowButton userId={u.id} size="sm" />
              )}
            </Link>
          ))}

          {!searched && (
            <div className="text-center py-16 text-gray-500">
              <p className="font-semibold text-white text-lg">Discover People</p>
              <p className="text-sm mt-1">Search for users by their username</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Explore
