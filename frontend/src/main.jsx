import 'regenerator-runtime/runtime'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useUiStore } from './store/uiStore.js'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

// Apply saved theme before first render — prevents flash of wrong theme
useUiStore.getState().initTheme()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-md)',
            },
            success: {
              iconTheme: { primary: '#0D9488', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
