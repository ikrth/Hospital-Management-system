import { create } from 'zustand'

const tokenFromStorage = localStorage.getItem('token')

export const useAuthStore = create((set) => ({
  user: null,
  token: tokenFromStorage,
  isAuthenticated: !!tokenFromStorage,
  isLoading: false,
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true, isLoading: false })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },
  setLoading: (isLoading) => set({ isLoading }),
}))
