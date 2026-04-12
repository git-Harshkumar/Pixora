import { create } from 'zustand'
import api from '../lib/api'

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: {},   // { [userId]: Message[] }
  isLoading: false,

  fetchConversations: async () => {
    try {
      const { data } = await api.get('/messages')
      set({ conversations: data.data.conversations })
    } catch (err) {
      console.error('fetchConversations error', err)
    }
  },

  fetchMessages: async (userId) => {
    set({ isLoading: true })
    try {
      const { data } = await api.get(`/messages/${userId}`)
      set((state) => ({
        messages: { ...state.messages, [userId]: data.data.messages },
        isLoading: false,
      }))
    } catch (err) {
      set({ isLoading: false })
    }
  },

  // Called when a message is received via socket
  receiveMessage: (message) => {
    const partnerId =
      message.sender.id === get()._currentUserId
        ? message.receiver.id
        : message.sender.id

    set((state) => ({
      messages: {
        ...state.messages,
        [partnerId]: [...(state.messages[partnerId] || []), message],
      },
    }))

    // Update conversations list
    set((state) => {
      const exists = state.conversations.find((c) => c.user.id === partnerId)
      if (exists) {
        return {
          conversations: state.conversations.map((c) =>
            c.user.id === partnerId ? { ...c, lastMessage: message } : c
          ),
        }
      }
      return {}
    })
  },

  setCurrentUserId: (id) => set({ _currentUserId: id }),
}))
