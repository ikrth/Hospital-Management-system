import { useState, useRef, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, Sun, Moon, LogOut, User } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useUnreadCount } from '../../hooks/useNotifications'
import NotificationDropdown from '../notifications/NotificationDropdown'

const TITLES = {
  '/dashboard':    'Dashboard',
  '/appointments': 'Appointments',
  '/appointments/new': 'Book Appointment',
  '/doctors':      'Doctors',
  '/patients':     'Patients',
  '/ai/triage':    'AI Symptom Check',
  '/ai/therapy':   'Therapy Chat',
  '/profile':      'My Profile',
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme, toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  const { data: unreadCount = 0 } = useUnreadCount()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setShowDropdown(false)
    logout()
    navigate('/login')
  }

  const title = TITLES[location.pathname] || 'MediCare'
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header
      className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-8 relative z-30 transition-colors duration-300"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Theme toggle (desktop convenience) */}
        <button
          onClick={toggleTheme}
          className="hidden sm:flex p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors",
              showNotifications && "bg-[var(--bg-secondary)] text-[var(--accent)]"
            )}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[var(--bg-primary)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <NotificationDropdown 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* User Dropdown */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-full ring-2 ring-transparent transition-all focus:outline-none focus:ring-[var(--accent)]"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ background: 'var(--accent)' }}
            >
              {initials}
            </div>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
                <div className="p-1">
                  {user?.role === 'patient' && (
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <User size={16} className="text-[var(--text-secondary)]" />
                      My Profile
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
