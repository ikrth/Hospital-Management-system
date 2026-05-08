import { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppointments, useCancelAppointment } from '../hooks/useAppointments'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import NewAppointment from './NewAppointment'
import { CalendarDays, Clock, CheckCircle2, XCircle, Plus, ChevronLeft, ChevronRight, FileText, CheckSquare } from 'lucide-react'
import CreateRecordModal from '../components/records/CreateRecordModal'
import { useAuthStore } from '../store/authStore'
import { updateAppointmentStatus } from '../api/appointments'
import toast from 'react-hot-toast'

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

const STATUS_STYLES = {
  pending:   { cls: 'badge-yellow', icon: Clock },
  confirmed: { cls: 'badge-teal',   icon: CheckCircle2 },
  completed: { cls: 'badge-teal',   icon: CheckCircle2 },
  cancelled: { cls: 'badge-red',    icon: XCircle },
}

function AppointmentCard({ appt, onCancel, onComplete, onCreateRecord, user }) {
  const doctorName = appt?.doctor?.user?.name || appt?.doctor?.name || 'Unknown Doctor'
  const patientName = appt?.patient?.user?.name || appt?.patient?.name || 'Unknown Patient'
  const specialization = appt?.doctor?.specialization || ''
  const date = appt?.date ? new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const time = appt?.timeSlot || '—'
  const type = appt?.type || 'general'
  const priority = appt?.priorityLevel || 'medium'
  const status = appt?.status || 'pending'
  const { cls } = STATUS_STYLES[status] || { cls: 'badge-gray' }

  const priorityColor = { critical: '#dc2626', high: '#f97316', medium: '#f59e0b', low: '#10b981' }[priority] || '#6b7280'

  const isDoctor = user?.role === 'doctor'
  const displayName = isDoctor ? patientName : doctorName

  return (
    <div className="card p-4 flex items-start justify-between gap-4 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-light)' }}
        >
          <CalendarDays size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {isDoctor ? `Patient: ${displayName}` : `Dr. ${displayName}`}
          </p>
          {specialization && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{specialization}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{date} · {time}</span>
            <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: priorityColor + '1a', color: priorityColor }}>
              {priority} priority
            </span>
            <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {type}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`badge ${cls} capitalize`}>{status}</span>
        <div className="flex gap-2">
          {/* Doctor: Complete button on confirmed appointments */}
          {isDoctor && status === 'confirmed' && (
            <button
              className="btn btn-primary text-xs px-3 py-1 inline-flex items-center gap-1"
              onClick={() => onComplete(appt._id || appt.id)}
            >
              <CheckSquare size={14} /> Complete
            </button>
          )}
          {/* Cancel button for non-terminal statuses */}
          {status !== 'cancelled' && status !== 'completed' && (
            <button
              className="btn btn-danger text-xs px-3 py-1"
              onClick={() => onCancel(appt._id || appt.id)}
            >
              Cancel
            </button>
          )}
          {/* Create Record button after completion */}
          {status === 'completed' && !appt.hasRecord && user?.role === 'doctor' && (
            <button
              className="btn btn-secondary text-xs px-3 py-1 inline-flex items-center gap-1"
              onClick={() => onCreateRecord(appt)}
            >
              <FileText size={14} /> Record
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Appointments({ mode } = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [recordModalAppt, setRecordModalAppt] = useState(null)
  const PAGE_SIZE = 8

  const isNew = mode === 'new' || location.pathname.endsWith('/new')

  const filters = useMemo(
    () => ({ status: tab === 'all' ? undefined : tab, page, limit: PAGE_SIZE }),
    [tab, page]
  )

  const queryClient = useQueryClient()
  const { appointments, pagination, isLoading } = useAppointments(filters)
  const cancelMutation = useCancelAppointment()

  const completeMutation = useMutation({
    mutationFn: (id) => updateAppointmentStatus(id, 'completed'),
    onSuccess: () => {
      toast.success('Appointment marked as completed!')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to complete appointment'),
  })

  const handleCancel = (id) => {
    if (!id) return
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return
    cancelMutation.mutate(id)
  }

  const handleComplete = (id) => {
    if (!id) return
    if (!window.confirm('Mark this appointment as completed?')) return
    completeMutation.mutate(id)
  }

  if (isNew) return <NewAppointment onCancel={() => navigate('/appointments')} />

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Appointments</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {pagination.total ?? 0} total
          </p>
        </div>
        <Link to="/appointments/new" className="btn btn-primary">
          <Plus size={16} /> Book Appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
            style={{
              background: t === tab ? 'var(--accent)' : 'transparent',
              color: t === tab ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading && [1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 h-20 animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        ))}

        {!isLoading && appointments.length === 0 && (
          <div className="card p-12 text-center">
            <CalendarDays size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No appointments found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {tab !== 'all' ? `No ${tab} appointments` : 'Book your first appointment'}
            </p>
            <Link to="/appointments/new" className="btn btn-primary mt-4 inline-flex">
              <Plus size={16} /> Book Appointment
            </Link>
          </div>
        )}

        {!isLoading && appointments.map((a) => (
          <AppointmentCard key={a._id || a.id} appt={a} onCancel={handleCancel} onComplete={handleComplete} onCreateRecord={setRecordModalAppt} user={user} />
        ))}
      </div>

      {/* Pagination */}
      {!isLoading && appointments.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page {page}{pagination.totalPages ? ` of ${pagination.totalPages}` : ''}
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={appointments.length < PAGE_SIZE || page >= (pagination.totalPages || 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <CreateRecordModal 
        isOpen={!!recordModalAppt} 
        onClose={() => setRecordModalAppt(null)} 
        appointment={recordModalAppt} 
      />
    </div>
  )
}
