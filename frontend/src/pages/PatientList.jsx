import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPatients, deletePatient } from '../api/patients'
import { Search, UserCircle, Phone, Heart, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useDebounce } from '../hooks/useDebounce'
import { Card, Button, Skeleton } from '../components/common'

const PAGE_SIZE = 10

function PatientCard({ patient, isAdmin, onDelete }) {
  const name = patient.user?.name || 'Unknown Patient'
  const email = patient.user?.email || 'No email'
  const dob = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Card hover className="p-5 flex flex-col md:flex-row items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-lg" style={{ background: 'var(--accent)' }}>
          {initials}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{email}</p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              <UserCircle size={14} /> {patient.gender || '—'} · {dob}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#ef4444' }}>
              <Heart size={14} /> Blood: {patient.bloodGroup || '—'}
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                <Phone size={14} /> {patient.phone}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 items-center self-end md:self-auto w-full md:w-auto mt-2 md:mt-0">
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => onDelete(patient._id)}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete Patient"
          />
        )}
        <Button variant="secondary" size="sm" icon={FileText} className="w-full md:w-auto justify-center">
          View Records
        </Button>
      </div>
    </Card>
  )
}

export default function PatientList() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, debouncedQuery],
    queryFn: () => getPatients({ limit: PAGE_SIZE, page, q: debouncedQuery }),
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const patients = data?.data?.data || []
  const meta = data?.data?.meta || {}
  const totalPages = meta.totalPages || 1
  const totalRecords = meta.total || 0

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      toast.success('Patient deleted')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
    onError: () => toast.error('Failed to delete patient'),
  })

  const handleDelete = (id) => {
    if (window.confirm('Delete this patient?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Patients</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {totalRecords} registered patients found
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading && [1, 2, 3].map((i) => (
          <Skeleton key={i} variant="card" className="h-28" />
        ))}
        {!isLoading && patients.length === 0 && (
          <Card className="p-12 text-center">
            <UserCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No patients found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search criteria</p>
          </Card>
        )}
        {!isLoading && patients.map((p) => (
          <PatientCard key={p._id} patient={p} isAdmin={isAdmin} onDelete={handleDelete} />
        ))}
      </div>

      {!isLoading && patients.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
