import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ user: data.data.user, token: data.data.token, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed'
          set({ isLoading: false, error: msg })
          return { success: false, message: msg }
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/register', { username, email, password })
          set({ user: data.data.user, token: data.data.token, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed'
          set({ isLoading: false, error: msg })
          return { success: false, message: msg }
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.common['Authorization']
      },

      updateProfile: (updatedUser) => {
        set({ user: { ...get().user, ...updatedUser } })
      },

      setToken: (token) => {
        set({ token })
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'pixora-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
