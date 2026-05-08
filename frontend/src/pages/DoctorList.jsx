import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctors, getDoctorSlots, deleteDoctor } from '../api/doctors'
import { Link } from 'react-router-dom'
import { Search, Stethoscope, CalendarDays, Star, X, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useDebounce } from '../hooks/useDebounce'
import { Card, Button, Modal, Skeleton } from '../components/common'

function DoctorCard({ doc, onView, onDelete, isAdmin }) {
  const name = doc.user?.name || doc.name || 'Unknown Doctor'
  const rating = doc.rating ?? 0
  const experience = doc.experience ?? 0
  const isAvailable = doc.isAvailable !== false

  return (
    <Card hover className="p-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm text-white"
          style={{ background: 'var(--accent)' }}
        >
          {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{doc.specialization}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {experience > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{experience} yrs exp</span>
            )}
            {rating > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#f59e0b' }}>
                <Star size={11} fill="#f59e0b" /> {rating.toFixed(1)}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: isAvailable ? '#f0fdfa' : '#fef2f2',
                color: isAvailable ? '#0f766e' : '#b91c1c',
              }}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 items-center">
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => onDelete(doc)}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete Doctor"
          />
        )}
        <Button variant="secondary" size="sm" onClick={() => onView(doc)}>
          View Slots
        </Button>
        <Link to={`/appointments/new?doctorId=${doc._id}`} className="btn btn-primary text-xs">
          Book
        </Link>
      </div>
    </Card>
  )
}

function SlotsModal({ doctor, onClose }) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const name = doctor.user?.name || doctor.name || 'Doctor'
  const today = new Date().toISOString().split('T')[0]

  const loadSlots = async (d) => {
    setDate(d)
    if (!d) { setSlots([]); return }
    setLoading(true)
    try {
      const res = await getDoctorSlots(doctor._id, d)
      setSlots(res.data?.slots || [])
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`${name} — Available Slots`}>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{doctor.specialization}</p>
      <div className="mb-4">
        <label className="label">Select date</label>
        <input type="date" min={today} value={date} onChange={(e) => loadSlots(e.target.value)} className="input" />
      </div>
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>AVAILABLE SLOTS</p>
        {loading && (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        )}
        {!loading && !date && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pick a date to see slots.</p>}
        {!loading && date && slots.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No slots available.</p>}
        <div className="flex flex-wrap gap-2">
          {!loading && slots.map((s) => (
            <span key={s} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <Link to={`/appointments/new?doctorId=${doctor._id}`} className="btn btn-primary w-full justify-center">
          <CalendarDays size={16} /> Book Appointment
        </Link>
      </div>
    </Modal>
  )
}

export default function DoctorList() {
  const [query, setQuery] = useState('')
  const [specialization, setSpec] = useState('')
  const [selected, setSelected] = useState(null)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const debouncedQuery = useDebounce(query, 300)
  const debouncedSpec = useDebounce(specialization, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', debouncedQuery, debouncedSpec],
    queryFn: () => getDoctors({ limit: 50, q: debouncedQuery, specialization: debouncedSpec }),
    staleTime: 30_000,
  })
  const doctors = data?.data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDoctor(id),
    onSuccess: () => {
      toast.success('Doctor deleted')
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
    onError: () => toast.error('Failed to delete doctor'),
  })

  const handleDelete = (doc) => {
    if (window.confirm(`Delete Dr. ${doc.user?.name || doc.name}?`)) {
      deleteMutation.mutate(doc._id)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Doctors</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Find and book with available specialists</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Filter by specialization…" value={specialization} onChange={(e) => setSpec(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading && [1, 2, 3].map((i) => (
          <Skeleton key={i} variant="card" className="h-20" />
        ))}
        {!isLoading && doctors.length === 0 && (
          <Card className="p-12 text-center">
            <Stethoscope size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No doctors found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search</p>
          </Card>
        )}
        {!isLoading && doctors.map((d) => (
          <DoctorCard key={d._id} doc={d} isAdmin={isAdmin} onView={setSelected} onDelete={handleDelete} />
        ))}
      </div>

      {selected && <SlotsModal doctor={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
