import { create } from 'zustand'
import api from '../lib/api'

export const usePostStore = create((set, get) => ({
  feed: [],
  nextCursor: null,
  hasMore: true,
  isLoading: false,
  isFetchingMore: false,

  fetchFeed: async (reset = false) => {
    if (reset) {
      set({ feed: [], nextCursor: null, hasMore: true })
    }
    set({ isLoading: reset, isFetchingMore: !reset })
    try {
      const cursor = reset ? undefined : get().nextCursor
      const params = { limit: 10, ...(cursor && { cursor }) }
      const { data } = await api.get('/posts/feed', { params })
      const { feed, nextCursor } = data.data
      set((state) => ({
        feed: reset ? feed : [...state.feed, ...feed],
        nextCursor,
        hasMore: !!nextCursor,
        isLoading: false,
        isFetchingMore: false,
      }))
    } catch (err) {
      set({ isLoading: false, isFetchingMore: false })
    }
  },

  createPost: async (formData) => {
    const { data } = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    set((state) => ({ feed: [data.data.post, ...state.feed] }))
    return data.data.post
  },

  deletePost: async (postId) => {
    await api.delete(`/posts/${postId}`)
    set((state) => ({ feed: state.feed.filter((p) => p.id !== postId) }))
  },

  likePost: async (postId) => {
    // Optimistic update
    set((state) => ({
      feed: state.feed.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              _count: { ...p._count, likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1 },
            }
          : p
      ),
    }))
    try {
      await api.post(`/posts/${postId}/like`)
    } catch {
      // Revert on error
      set((state) => ({
        feed: state.feed.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                _count: { ...p._count, likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1 },
              }
            : p
        ),
      }))
    }
  },

  addComment: async (postId, text) => {
    const { data } = await api.post(`/posts/${postId}/comment`, { text })
    set((state) => ({
      feed: state.feed.map((p) =>
        p.id === postId
          ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } }
          : p
      ),
    }))
    return data.data.comment
  },
}))
