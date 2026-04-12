import { create } from 'zustand'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: (token, onMessage, onTyping) => {
    if (get().socket?.connected) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      set({ connected: true })
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
      set({ connected: false })
    })

    socket.on('message:receive', ({ message }) => {
      onMessage?.(message)
    })

    socket.on('typing:indicator', (data) => {
      onTyping?.(data)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Error:', err.message)
    })

    set({ socket })
  },

  disconnect: () => {
    get().socket?.disconnect()
    set({ socket: null, connected: false })
  },

  sendMessage: (receiverId, text) => {
    get().socket?.emit('message:send', { receiverId, text })
  },

  startTyping: (receiverId) => {
    get().socket?.emit('typing:start', { receiverId })
  },

  stopTyping: (receiverId) => {
    get().socket?.emit('typing:stop', { receiverId })
  },
}))
