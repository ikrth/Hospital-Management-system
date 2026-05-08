import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateAppointment } from '../hooks/useAppointments'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { getDoctors, getDoctorSlots } from '../api/doctors'
import { getMyProfile, getPatients } from '../api/patients'
import { ChevronLeft, CalendarDays, Clock, Search } from 'lucide-react'

const schema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  date:     z.string().min(1, 'Date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  type:     z.string().min(1, 'Type is required'),
})

export default function NewAppointment({ onCancel }) {
  const { user } = useAuthStore()
  const isStaff = ['admin', 'receptionist'].includes(user?.role)

  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'general' },
  })

  const create = useCreateAppointment()
  const [doctors, setDoctors]           = useState([])
  const [slots, setSlots]               = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // For patient role — auto-resolved patient ID
  const [patientId, setPatientId]       = useState(null)

  // For staff role — patient search
  const [patientSearch, setPatientSearch]   = useState('')
  const [patients, setPatients]             = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [loadingPatients, setLoadingPatients] = useState(false)

  const doctorId = watch('doctorId')
  const date     = watch('date')

  // Load doctors on mount, and auto-resolve patient profile if patient role
  useEffect(() => {
    let mounted = true
    getDoctors({ limit: 50 })
      .then((res) => { if (mounted) setDoctors(res.data?.data || []) })
      .catch(() => {})

    if (!isStaff) {
      // Patient: auto-load their own profile
      getMyProfile()
        .then((res) => {
          if (mounted) {
            const id = res?.data?.data?._id || res?.data?._id || res?._id || null
            setPatientId(id)
          }
        })
        .catch(() => {
          toast.error('Could not load your patient profile')
        })
    }

    return () => { mounted = false }
  }, [isStaff])

  // For staff: search patients as they type
  useEffect(() => {
    if (!isStaff) return
    let mounted = true
    setLoadingPatients(true)
    getPatients({ limit: 20, search: patientSearch })
      .then((res) => {
        if (mounted) setPatients(res?.data?.data || res?.data || [])
      })
      .catch(() => {
        if (mounted) setPatients([])
      })
      .finally(() => { if (mounted) setLoadingPatients(false) })
    return () => { mounted = false }
  }, [isStaff, patientSearch])

  // Load slots when doctor + date selected
  useEffect(() => {
    if (!doctorId || !date) { setSlots([]); return }
    let mounted = true
    setLoadingSlots(true)
    getDoctorSlots(doctorId, date)
      .then((res) => { if (mounted) setSlots(res.data?.slots || res?.slots || []) })
      .catch(() => { if (mounted) setSlots([]) })
      .finally(() => { if (mounted) setLoadingSlots(false) })
    return () => { mounted = false }
  }, [doctorId, date])

  const onSubmit = async (values) => {
    const resolvedPatientId = isStaff ? selectedPatientId : patientId

    if (!resolvedPatientId) {
      if (isStaff) {
        toast.error('Please select a patient first.')
      } else {
        toast.error('Patient profile not found. Please complete your profile first.')
      }
      return
    }

    try {
      await create.mutateAsync({
        doctor:   values.doctorId,
        patient:  resolvedPatientId,
        date:     values.date,
        timeSlot: values.timeSlot,
        type:     values.type,
      })
      toast.success('Appointment booked!')
      if (onCancel) onCancel()
    } catch (err) {
      if (err?.fieldErrors) {
        Object.entries(err.fieldErrors).forEach(([field, msg]) => {
          setError(field, { type: 'server', message: Array.isArray(msg) ? msg.join(' ') : msg })
        })
        return
      }
      toast.error(err?.response?.data?.message || err?.message || 'Failed to book appointment')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost p-2"
            style={{ border: '1px solid var(--border)' }}
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Book Appointment
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isStaff ? 'Search a patient and schedule their appointment' : 'Fill in the details below to schedule a visit'}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Patient selector — staff only */}
          {isStaff && (
            <div>
              <label className="label">Patient</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Search patient by name or email…"
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatientId('') }}
                />
              </div>
              <select
                className="input"
                style={{ appearance: 'auto' }}
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">
                  {loadingPatients ? 'Loading patients…' : patients.length === 0 ? 'No patients found' : 'Select a patient…'}
                </option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.user?.name || 'Unknown'} — {p.user?.email || ''}
                  </option>
                ))}
              </select>
              {!selectedPatientId && (
                <p className="error-msg mt-1">Patient is required</p>
              )}
            </div>
          )}

          {/* Doctor */}
          <div>
            <label className="label">Doctor</label>
            <select
              id="doctor-select"
              {...register('doctorId')}
              className="input"
              style={{ appearance: 'auto' }}
            >
              <option value="">Select a doctor…</option>
              {doctors.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.user?.name || d.name || 'Unknown'} — {d.specialization}
                </option>
              ))}
            </select>
            {errors.doctorId && <p className="error-msg">{errors.doctorId.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="label">Appointment Type</label>
            <select id="type-select" {...register('type')} className="input" style={{ appearance: 'auto' }}>
              <option value="general">General</option>
              <option value="followup">Follow-up</option>
              <option value="specialist">Specialist</option>
              <option value="emergency">Emergency</option>
              <option value="therapy">Therapy</option>
            </select>
            {errors.type && <p className="error-msg">{errors.type.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input
              id="date-input"
              type="date"
              min={today}
              {...register('date')}
              className="input"
            />
            {errors.date && <p className="error-msg">{errors.date.message}</p>}
          </div>

          {/* Time Slot */}
          <div>
            <label className="label">Time Slot</label>
            {loadingSlots ? (
              <div className="input flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <Clock size={14} className="animate-spin" /> Loading slots…
              </div>
            ) : (
              <select
                id="timeslot-select"
                {...register('timeSlot')}
                className="input"
                style={{ appearance: 'auto' }}
                disabled={slots.length === 0}
              >
                <option value="">
                  {doctorId && date
                    ? slots.length === 0 ? 'No slots available for this date' : 'Select a time slot…'
                    : 'Select a doctor and date first'}
                </option>
                {slots.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            {errors.timeSlot && <p className="error-msg">{errors.timeSlot.message}</p>}
          </div>

          {/* Slots preview pills */}
          {slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="btn btn-primary flex-1 justify-center"
              style={{ padding: '0.75rem' }}
            >
              {create.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Booking…
                </span>
              ) : (
                <><CalendarDays size={16} /> Book Appointment</>
              )}
            </button>
            {onCancel && (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
