import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecordById, updateRecord, generateAISummary } from '../api/medicalRecords'
import { 
  Printer, 
  ArrowLeft, 
  Clock, 
  Pill, 
  FlaskConical, 
  FileText, 
  Brain, 
  User, 
  Calendar,
  Stethoscope,
  Edit2,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Badge, Skeleton, Avatar } from '../components/common'
import toast from 'react-hot-toast'

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: () => getRecordById(id),
  })

  const aiMutation = useMutation({
    mutationFn: () => generateAISummary(id),
    onSuccess: () => {
      toast.success('AI Summary generated')
      queryClient.invalidateQueries(['medical-record', id])
    },
    onError: () => toast.error('Failed to generate AI summary')
  })

  const record = data?.data
  const isDoctor = user?.role === 'doctor'
  const isCreator = isDoctor && record?.doctor?._id === user?.id // Simplified check, might need better logic if backend returns doctor ID directly
  
  // Can update within 24 hours
  const canEdit = isDoctor && record && (Date.now() - new Date(record.createdAt).getTime() < 24 * 60 * 60 * 1000)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) return <div className="p-8"><Skeleton variant="card" className="h-96" /></div>
  if (error || !record) return <div className="p-8 text-center"><p>Record not found.</p><Button onClick={() => navigate(-1)}>Back</Button></div>

  const patientName = record.patient?.user?.name || 'Unknown Patient'
  const doctorName = record.doctor?.user?.name || 'Unknown Doctor'
  const date = new Date(record.createdAt).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  return (
    <div className="flex flex-col gap-8 animate-fade-in medical-record-container">
      {/* Header / Nav */}
      <div className="flex items-center justify-between no-print">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft size={18} /> Back to Records
        </button>
        <div className="flex gap-3 action-buttons">
          {canEdit && (
            <Button variant="secondary" icon={Edit2}>Edit Record</Button>
          )}
          <Button variant="primary" icon={Printer} onClick={handlePrint}>Print Record</Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print-header text-center">
        <h1 className="text-3xl font-display font-bold">Medicare Hospital Management</h1>
        <p className="text-sm">123 Health Street, Medical District · +1 (555) 000-1234</p>
        <div className="mt-4 border-t-2 border-[var(--accent)] pt-4 flex justify-between">
          <div className="text-left">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Medical Record ID</p>
            <p className="font-mono text-sm">{record._id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Date Generated</p>
            <p className="text-sm">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Record Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-8 border-l-4 border-l-[var(--accent)]">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={patientName} size="lg" className="bg-[var(--accent-light)] text-[var(--accent)]" />
              <div>
                <h3 className="text-2xl font-bold">{patientName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {date}</span>
                  <span className="flex items-center gap-1.5"><Stethoscope size={14} /> Dr. {doctorName}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Final Diagnosis</h4>
                <p className="text-xl font-semibold text-[var(--text-primary)] leading-relaxed">
                  {record.diagnosis}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Clinical Notes</h4>
                <div className="bg-[var(--bg-secondary)] p-5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                  {record.notes || "No additional clinical notes provided."}
                </div>
              </div>
            </div>
          </Card>

          {/* AI Discharge Summary (Expansion 4 Stub) */}
          {record.dischargeSummary ? (
            <Card className="p-8 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/20 dark:to-[var(--bg-card)] border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-4 text-[var(--accent)]">
                <Brain size={20} />
                <h4 className="font-bold">AI Clinical Summary</h4>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {record.dischargeSummary}
              </div>
            </Card>
          ) : isDoctor && (
            <div className="no-print">
               <Card className="p-6 border-dashed border-2 flex flex-col items-center gap-4 text-center">
                  <Brain size={32} className="text-[var(--text-muted)]" />
                  <div>
                    <h4 className="font-bold">Generate AI Discharge Summary</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Use our clinical AI to generate a professional summary based on these notes.</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    icon={aiMutation.isPending ? Loader2 : Brain} 
                    onClick={() => aiMutation.mutate()}
                    isLoading={aiMutation.isPending}
                  >
                    Process with AI
                  </Button>
               </Card>
            </div>
          )}
        </div>

        {/* Right Column: Prescriptions & Labs */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="text-teal-500" size={18} />
              <h4 className="font-bold">Prescriptions</h4>
            </div>
            <div className="space-y-4">
              {record.prescription?.length > 0 ? record.prescription.map((p, i) => (
                <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <span className="font-bold text-sm">{p.medicine}</span>
                  <div className="flex gap-2">
                    <Badge variant="teal" size="sm" className="text-[10px]">{p.dosage}</Badge>
                    <Badge variant="gray" size="sm" className="text-[10px]">{p.duration}</Badge>
                  </div>
                </div>
              )) : <p className="text-sm text-[var(--text-muted)] italic">No medications prescribed.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="text-blue-500" size={18} />
              <h4 className="font-bold">Lab Tests Ordered</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {record.labTests?.length > 0 ? record.labTests.map((t, i) => (
                <Badge key={i} variant="blue">{t}</Badge>
              )) : <p className="text-sm text-[var(--text-muted)] italic">No lab tests ordered.</p>}
            </div>
          </Card>

          {/* Follow-up Section (Expansion 4) */}
          {record.followUpSuggestions && (
            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-2 mb-4 text-orange-600">
                <Clock size={18} />
                <h4 className="font-bold">Follow-up Instructions</h4>
              </div>
              <p className="text-sm mb-3"><strong>Due:</strong> {record.followUpSuggestions.followUpIn}</p>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Warning Signs</p>
                <div className="flex flex-wrap gap-1">
                  {record.followUpSuggestions.warningSigns?.map((s, i) => (
                    <Badge key={i} variant="red" size="sm">{s}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
