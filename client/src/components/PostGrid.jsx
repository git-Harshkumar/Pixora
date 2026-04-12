import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'

const PostGrid = ({ posts = [] }) => {
  if (!posts.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="font-semibold text-white">No posts yet</p>
        <p className="text-sm mt-1">When posts are shared, they'll appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/post/${post.id}`}
          className="relative aspect-square overflow-hidden group"
        >
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5">
            <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
              <Heart size={18} fill="white" />
              {post._count?.likes ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
              <MessageCircle size={18} fill="white" />
              {post._count?.comments ?? 0}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default PostGrid
