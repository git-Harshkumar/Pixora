import React, { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { usePostStore } from '../store/postStore'
import PostCard from '../components/PostCard'
import Navbar from '../components/Navbar'

const Feed = () => {
  const { feed, fetchFeed, hasMore, isLoading, isFetchingMore } = usePostStore()
  const sentinelRef = useRef(null)

  useEffect(() => {
    fetchFeed(true)
  }, [])

  // Intersection Observer for infinite scroll
  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
        fetchFeed(false)
      }
    },
    [hasMore, isFetchingMore, fetchFeed]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 })
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [handleIntersect])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-14">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <FeedSkeleton key={i} />)}
            </div>
          ) : feed.length === 0 ? (
            <EmptyFeed />
          ) : (
            <>
              {feed.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="flex justify-center py-4">
                {isFetchingMore && <Loader2 size={24} className="animate-spin text-brand-500" />}
                {!hasMore && feed.length > 0 && (
                  <p className="text-gray-500 text-sm">You're all caught up </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

const FeedSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="flex items-center gap-3 p-4">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-2 w-20 rounded" />
      </div>
    </div>
    <div className="skeleton aspect-square w-full" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-3 w-1/3 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  </div>
)

const EmptyFeed = () => (
  <div className="card p-12 text-center space-y-3">
    <h2 className="font-semibold text-lg text-white">Your feed is empty</h2>
    <p className="text-gray-500 text-sm">Follow people to see their posts here.</p>
  </div>
)

export default Feed
