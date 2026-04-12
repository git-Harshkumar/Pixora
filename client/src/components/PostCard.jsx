import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, X
} from 'lucide-react'
import { formatDistanceToNow } from '../utils/time'
import { useAuthStore } from '../store/authStore'
import { usePostStore } from '../store/postStore'
import Avatar from './Avatar'
import api from '../lib/api'
import toast from 'react-hot-toast'

const PostCard = ({ post }) => {
  const { user } = useAuthStore()
  const { likePost, deletePost } = usePostStore()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const commentInputRef = useRef(null)

  const isOwner = user?.id === post.author.id
  const likesCount = post._count?.likes ?? 0
  const commentsCount = post._count?.comments ?? 0

  const handleLike = () => likePost(post.id)

  const handleShowComments = async () => {
    setShowComments((v) => !v)
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      try {
        const { data } = await api.get(`/posts/${post.id}/comments`)
        setComments(data.data.comments)
      } finally {
        setLoadingComments(false)
      }
    }
    setTimeout(() => commentInputRef.current?.focus(), 100)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      const { data } = await api.post(`/posts/${post.id}/comment`, { text: commentText })
      setComments((c) => [...c, data.data.comment])
      setCommentText('')
    } catch {
      toast.error('Could not add comment')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePost(post.id)
      toast.success('Post deleted')
    } catch {
      toast.error('Could not delete post')
    }
    setShowMenu(false)
  }

  return (
    <article className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Avatar src={post.author.avatar} username={post.author.username} size="sm" />
          <div>
            <p className="font-semibold text-sm text-white">{post.author.username}</p>
            <p className="text-xs text-gray-500">{formatDistanceToNow(post.createdAt)}</p>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-all"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 card py-1 min-w-[120px] shadow-xl">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-surface-elevated transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:bg-surface-elevated transition-colors"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative bg-black aspect-square overflow-hidden">
        <img
          src={post.imageUrl}
          alt={post.caption || 'Post image'}
          className="w-full h-full object-cover"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ActionBtn
              onClick={handleLike}
              active={post.isLiked}
              icon={<Heart size={22} fill={post.isLiked ? '#f43f5e' : 'none'} />}
              activeClass="text-rose-400"
            />
            <ActionBtn onClick={handleShowComments} icon={<MessageCircle size={22} />} />
            <ActionBtn icon={<Send size={22} />} />
          </div>
          <ActionBtn icon={<Bookmark size={22} />} />
        </div>

        {likesCount > 0 && (
          <p className="text-sm font-semibold text-white mt-1">
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {post.caption && (
          <p className="text-sm text-gray-200 mt-1">
            <Link to={`/profile/${post.author.username}`} className="font-semibold text-white mr-1.5 hover:underline">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {commentsCount > 0 && (
          <button
            onClick={handleShowComments}
            className="text-xs text-gray-500 mt-1 hover:text-gray-300 transition-colors"
          >
            View all {commentsCount} comments
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-3 space-y-2 border-t border-surface-border mt-2 pt-3">
          {loadingComments ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="skeleton w-7 h-7 rounded-full" />
                  <div className="skeleton h-6 flex-1 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 items-start">
                  <Avatar src={c.user.avatar} username={c.user.username} size="xs" />
                  <div>
                    <span className="text-xs font-semibold text-white mr-1.5">{c.user.username}</span>
                    <span className="text-xs text-gray-300">{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-surface-border">
            <input
              ref={commentInputRef}
              type="text"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {commentText.trim() && (
              <button type="submit" className="text-brand-500 text-sm font-semibold hover:opacity-80 transition-opacity">
                Post
              </button>
            )}
          </form>
        </div>
      )}
    </article>
  )
}

const ActionBtn = ({ onClick, icon, active, activeClass = 'text-brand-400' }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-xl transition-all duration-200 hover:bg-surface-elevated active:scale-90
      ${active ? activeClass : 'text-gray-300 hover:text-white'}`}
  >
    {icon}
  </button>
)

export default PostCard
