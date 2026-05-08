import { useLocation } from 'react-router-dom'
import { Sun, Moon, Bell } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useUnreadCount } from '../../hooks/useNotifications'
import NotificationDropdown from '../notifications/NotificationDropdown'
import GlobalSearch from './GlobalSearch'
import { useState } from 'react'

const TITLES = {
  '/dashboard':    'Dashboard',
  '/appointments': 'Appointments',
  '/doctors':      'Doctors',
  '/patients':     'Patients',
  '/ai/triage':    'AI Symptom Triage',
  '/ai/therapy':   'Therapy Chat',
  '/profile':      'My Profile',
}

export default function Topbar() {
  const { theme, toggleTheme, isSidebarOpen } = useUiStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const { count } = useUnreadCount()

  const title = TITLES[location.pathname] ?? 'Hospital MS'

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header
      className="fixed top-0 right-0 z-20 h-16 flex items-center px-6 gap-4"
      style={{
        left: isSidebarOpen ? 'var(--sidebar-width)' : '64px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        transition: 'left 0.3s ease',
      }}
    >
      {/* Page title */}
      <h1
        className="font-display font-semibold text-lg truncate"
        style={{ color: 'var(--text-primary)', width: '200px' }}
      >
        {title}
      </h1>

      <GlobalSearch />

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--bg-secondary)]"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--bg-secondary)] relative"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            aria-label="Notifications"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Bell size={18} />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[var(--bg-primary)]">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
          
          <NotificationDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
        </div>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ background: 'var(--accent)' }}
          title={user?.name}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
