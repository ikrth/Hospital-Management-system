import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useUiStore } from '../../store/uiStore'

export default function AppLayout() {
  const { setSidebarOpen } = useUiStore()
  const location = useLocation()

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname, setSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-[260px] transition-[padding] duration-300 ease-in-out">
        <Navbar />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
