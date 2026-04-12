import React, { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const FollowButton = ({ userId, initialFollowing = false, onToggle, size = 'md' }) => {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleClick = async (e) => {
    e.stopPropagation()
    setLoading(true)
    // Optimistic update
    setFollowing((f) => !f)
    try {
      const { data } = await api.post(`/users/${userId}/follow`)
      setFollowing(data.data.following)
      onToggle?.(data.data.following)
    } catch (err) {
      setFollowing((f) => !f) // revert
      toast.error('Action failed')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-5 py-2 text-sm'

  if (following) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${sizeClasses} flex items-center gap-1.5 rounded-xl font-semibold
          border border-surface-border text-white hover:border-red-500 hover:text-red-400
          transition-all duration-200 disabled:opacity-50`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
        Following
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} flex items-center gap-1.5 rounded-xl font-semibold
        bg-brand-600 text-white hover:opacity-90 active:scale-95
        transition-all duration-200 disabled:opacity-50`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
      Follow
    </button>
  )
}

export default FollowButton
