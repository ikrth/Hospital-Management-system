import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, Stethoscope,
  Brain, Heart, User, UserCheck, Sun, Moon, LogOut, FileText
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { cn } from '../../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import SidebarSearch from './SidebarSearch'

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, isSidebarOpen, setSidebarOpen } = useUiStore()

  // Define navigation items per role
  const navItems = []
  navItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' })

  if (user?.role === 'patient') {
    navItems.push(
      { icon: Calendar,    label: 'Appointments',     path: '/appointments' },
      { icon: Stethoscope, label: 'Find Doctors',     path: '/doctors' },
      { icon: Brain,       label: 'AI Symptom Check', path: '/ai/triage' },
      { icon: Heart,       label: (
        <span className="flex items-center gap-2">
          Therapy Chat
          <span className="text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-600 px-1.5 py-0.5 rounded-full">Voice</span>
        </span>
      ),     path: '/ai/therapy' },
      { icon: FileText,    label: 'Medical Records',  path: '/records' },
      { icon: User,        label: 'My Profile',       path: '/profile' }
    )
  } else if (user?.role === 'doctor') {
    navItems.push(
      { icon: Calendar, label: 'My Schedule', path: '/appointments' },
      { icon: Users,    label: 'My Patients', path: '/patients' },
      { icon: FileText, label: 'Patient Records', path: '/records' }
    )
  } else if (user?.role === 'admin' || user?.role === 'receptionist') {
    navItems.push(
      { icon: Calendar,  label: 'All Appointments', path: '/appointments' },
      { icon: Users,     label: 'Patients',         path: '/patients' },
      { icon: UserCheck, label: 'Doctors',          path: '/doctors' }
    )
    if (user?.role === 'admin') {
      navItems.push({ icon: Users, label: 'User Management', path: '/admin/users' })
    }
    navItems.push({ icon: Calendar, label: 'Doctor Schedules', path: '/admin/schedules' })
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Top: Logo */}
        <div className="h-16 flex items-center gap-3 px-6 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
            {/* "Teal cross icon from lucide-react" -> Plus acts as a medical cross */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>MediCare</span>
        </div>

        {/* Middle: Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5">
          <SidebarSearch />
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false)
              }}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-l-4',
                isActive 
                  ? 'border-[var(--accent)] bg-[var(--accent-light)]' 
                  : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
              )}
              style={({ isActive }) => isActive ? { color: 'var(--accent)', background: 'rgba(13, 148, 136, 0.1)' } : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User & Theme */}
        <div className="p-4 flex flex-col gap-2 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preferences</span>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-primary)]"
              style={{ color: 'var(--text-secondary)' }}
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
          </div>

          <div className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors hover:bg-[var(--bg-primary)]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--accent)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs capitalize truncate" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 mt-1 rounded-xl text-sm font-medium w-full transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
