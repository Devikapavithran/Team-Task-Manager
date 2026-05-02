import { create } from 'zustand'
import { authAPI } from '../api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('tf_user') || 'null'),
  token: localStorage.getItem('tf_token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const data = await authAPI.login(credentials)
      localStorage.setItem('tf_token', data.token)
      localStorage.setItem('tf_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return data
    } catch (err) {
      set({ error: err.error || 'Login failed', loading: false })
      throw err
    }
  },

  signup: async (userData) => {
    set({ loading: true, error: null })
    try {
      const data = await authAPI.signup(userData)
      localStorage.setItem('tf_token', data.token)
      localStorage.setItem('tf_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return data
    } catch (err) {
      set({ error: err.error || 'Signup failed', loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    set({ user: null, token: null })
  },

  updateUser: (userData) => {
    const updated = { ...get().user, ...userData }
    localStorage.setItem('tf_user', JSON.stringify(updated))
    set({ user: updated })
  },

  isAdmin: () => get().user?.role === 'admin',
  isReviewer: () => ['admin', 'reviewer'].includes(get().user?.role),
}))

export default useAuthStore
