import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRecords } from '../api/medicalRecords'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  ChevronRight, 
  ClipboardList, 
  FlaskConical, 
  Pill,
  Clock
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Badge, Skeleton, Timeline } from '../components/common'
import { useDebounce } from '../hooks/useDebounce'

export default function MedicalRecords() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(query, 300)

  const isPatient = user?.role === 'patient'
  const isDoctor = user?.role === 'doctor'
  const isAdmin = user?.role === 'admin'

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', page, debouncedQuery],
    queryFn: () => getRecords({ page, limit: 10, q: debouncedQuery }),
    staleTime: 30000,
  })

  const records = data?.data?.records || []
  const meta = data?.data?.meta || {}

  const timelineItems = records.map(r => ({
    id: r._id,
    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    title: r.diagnosis,
    subtitle: `Dr. ${r.doctor?.user?.name || 'Unknown'} · ${new Date(r.createdAt).getFullYear()}`,
    icon: ClipboardList,
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {r.prescription?.slice(0, 2).map((p, i) => (
            <Badge key={i} variant="teal" icon={Pill}>{p.medicine}</Badge>
          ))}
          {r.labTests?.slice(0, 2).map((t, i) => (
            <Badge key={i} variant="blue" icon={FlaskConical}>{t}</Badge>
          ))}
        </div>
        <p className="line-clamp-2 text-xs">{r.notes}</p>
        <Link to={`/records/${r._id}`}>
          <Button variant="ghost" size="sm" className="mt-1">View Full Record</Button>
        </Link>
      </div>
    )
  }))

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            {isPatient ? 'My Medical History' : 'Patient Records'}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {meta.total || 0} total records found
          </p>
        </div>
        {isDoctor && (
          <Link to="/appointments">
            <Button variant="primary" icon={Plus}>Complete Appointment to Add Record</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input 
            className="pl-10" 
            placeholder={isPatient ? "Search diagnosis or doctor..." : "Search patient name or diagnosis..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" className="h-32" />)}
        </div>
      ) : records.length === 0 ? (
        <Card className="p-16 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
            <FileText size={32} className="text-[var(--text-muted)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No medical records yet</h3>
            <p className="text-[var(--text-secondary)]">Records appear here after a completed appointment.</p>
          </div>
        </Card>
      ) : isPatient ? (
        <Timeline items={timelineItems} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Patient</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Date</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Diagnosis</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                        {r.patient?.user?.name?.[0] || 'P'}
                      </div>
                      <span className="font-medium">{r.patient?.user?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-sm">{r.diagnosis}</span>
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/records/${r._id}`}>
                      <Button variant="ghost" size="sm" icon={ChevronRight}>View Details</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button 
            variant="secondary" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm font-medium px-4">Page {page} of {meta.totalPages}</span>
          <Button 
            variant="secondary" 
            disabled={page === meta.totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
