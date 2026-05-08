import { create } from 'zustand'

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useUiStore = create((set) => ({
  theme: 'light',
  isSidebarOpen: true,

  /** Read saved theme from localStorage or use system preference, then apply */
  initTheme: () => {
    const saved = localStorage.getItem('theme')
    let theme = 'light'
    if (saved === 'dark' || saved === 'light') {
      theme = saved
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    }
    applyTheme(theme)
    set({ theme })
  },

  /** Toggle between light and dark, persist to localStorage */
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      applyTheme(next)
      return { theme: next }
    })
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),
}))
