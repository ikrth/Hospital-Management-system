import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useNotifications, 
  useMarkAsRead, 
  useMarkAllAsRead, 
  useDeleteNotification 
} from '../hooks/useNotifications'
import { 
  Bell, 
  Check, 
  Trash2, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Info,
  MoreVertical,
  CheckCheck
} from 'lucide-react'
import { Card, Button, Badge, Skeleton } from '../components/common'
import { cn } from '../utils/cn'

const ICON_MAP = {
  appointment_booked: Calendar,
  appointment_confirmed: Calendar,
  appointment_cancelled: Calendar,
  appointment_reminder: Calendar,
  new_record: FileText,
  priority_alert: AlertCircle,
  system: Info,
}

export default function Notifications() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data, isLoading } = useNotifications({ unread: unreadOnly })
  const markRead = useMarkAsRead()
  const markAllRead = useMarkAllAsRead()
  const deleteNotif = useDeleteNotification()

  const notifications = data?.data?.notifications || []

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">Notifications</h2>
          <p className="text-[var(--text-secondary)]">Manage your alerts and system updates</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            icon={CheckCheck}
            onClick={() => markAllRead.mutate()}
            disabled={!notifications.some(n => !n.isRead)}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-[var(--border)] pb-1">
        <button 
          onClick={() => setUnreadOnly(false)}
          className={cn(
            "pb-3 px-2 text-sm font-bold transition-colors relative",
            !unreadOnly ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          All
          {!unreadOnly && <motion.div layoutId="notif-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
        </button>
        <button 
          onClick={() => setUnreadOnly(true)}
          className={cn(
            "pb-3 px-2 text-sm font-bold transition-colors relative",
            unreadOnly ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          Unread
          {unreadOnly && <motion.div layoutId="notif-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" className="h-24" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
            <Bell size={40} className="text-[var(--text-muted)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold">All caught up!</h3>
            <p className="text-[var(--text-secondary)]">You don't have any {unreadOnly ? 'unread' : ''} notifications.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Info
            return (
              <Card 
                key={n._id} 
                className={cn(
                  "p-5 flex gap-4 items-start transition-all border-l-4",
                  !n.isRead ? "border-l-[var(--accent)] bg-teal-50/20 dark:bg-teal-900/10" : "border-l-transparent"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl",
                  !n.isRead ? "bg-[var(--accent)] text-white shadow-lg shadow-teal-500/20" : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                )}>
                  <Icon size={20} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={cn("font-bold", !n.isRead ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4">
                    {!n.isRead && (
                      <button 
                        onClick={() => markRead.mutate(n._id)}
                        className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                      >
                        <Check size={14} /> Mark as read
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotif.mutate(n._id)}
                      className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
