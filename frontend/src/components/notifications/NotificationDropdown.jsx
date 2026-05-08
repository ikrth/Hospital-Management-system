import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Trash2, Calendar, FileText, AlertCircle, Info } from 'lucide-react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications'
import { Button, Badge, Skeleton } from '../common'

const ICON_MAP = {
  appointment_booked: Calendar,
  appointment_confirmed: Calendar,
  appointment_cancelled: Calendar,
  appointment_reminder: Calendar,
  new_record: FileText,
  priority_alert: AlertCircle,
  system: Info,
}

export default function NotificationDropdown({ isOpen, onClose }) {
  const { data, isLoading } = useNotifications({ limit: 5 })
  const markRead = useMarkAsRead()
  const markAllRead = useMarkAllAsRead()

  const notifications = data?.data?.notifications || []

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 mt-2 w-80 max-h-[480px] rounded-xl shadow-xl overflow-hidden border z-50 flex flex-col"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <h4 className="font-bold text-sm">Notifications</h4>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={() => markAllRead.mutate()}
            className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Bell size={24} className="text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-secondary)]">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((n) => {
              const Icon = ICON_MAP[n.type] || Info
              return (
                <div 
                  key={n._id} 
                  className={`p-4 flex gap-3 hover:bg-[var(--bg-secondary)] transition-colors relative group ${!n.isRead ? 'bg-teal-50/30 dark:bg-teal-900/10' : ''}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 h-fit ${!n.isRead ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${!n.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{n.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1.5 uppercase font-medium">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button 
                      onClick={() => markRead.mutate(n._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white dark:hover:bg-gray-800 transition-all absolute right-2 top-2"
                    >
                      <Check size={12} className="text-[var(--accent)]" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Link 
        to="/notifications" 
        onClick={onClose}
        className="px-4 py-3 text-center border-t text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-colors"
        style={{ borderColor: 'var(--border)' }}
      >
        View all notifications
      </Link>
    </motion.div>
  )
}
