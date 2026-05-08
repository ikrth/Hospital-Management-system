import React, { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTriage } from '../hooks/useAI'
import { checkOllamaHealth } from '../api/ai'
import { getDoctors, getDoctorSlots } from '../api/doctors'
import { createAppointment } from '../api/appointments'
import { getMyProfile } from '../api/patients'
import { Button, Card, Badge, Input, Avatar } from '../components/common'
import { Plus, X, Brain, CheckCircle, Clock, AlertCircle, Star, Calendar } from 'lucide-react'

const formSchema = z.object({
  patientAge: z.coerce.number().min(1, 'Age is required'),
  patientGender: z.string().min(1, 'Gender is required'),
})

const loadingMessages = [
  "Analyzing symptoms...",
  "Consulting medical database...",
  "Calculating priority..."
]

const AITriage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [symptoms, setSymptoms] = useState([])
  const [symptomInput, setSymptomInput] = useState('')
  const [triageResult, setTriageResult] = useState(null)
  const [matchingDoctors, setMatchingDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)

  const { analyze, isLoading } = useTriage()

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length)
      }, 1500)
    } else {
      setLoadingMsgIdx(0)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { patientAge: '', patientGender: '' },
  })

  const addSymptom = () => {
    const value = symptomInput.trim()
    if (!value) return
    if (!symptoms.includes(value)) {
      setSymptoms((prev) => [...prev, value])
    }
    setSymptomInput('')
  }

  const removeSymptom = (value) => {
    setSymptoms((prev) => prev.filter((item) => item !== value))
  }

  const handleAnalyze = async () => {
    if (symptoms.length === 0) {
      toast.error('Add at least one symptom')
      return
    }

    setStep(2) // Move to loading step
    setAiUnavailable(false)
    const { patientAge, patientGender } = getValues()

    try {
      const response = await analyze({
        symptoms,
        patientAge,
        patientGender,
      })

      // Backend: sendSuccess wraps as { success, data: triageObj }
      // Axios adds its own .data layer: axios.data = { success, data: triageObj }
      const result = response?.data?.data ?? response?.data ?? response
      console.log('Triage raw response:', response)
      console.log('Triage result:', result)

      if (!result || !result.recommendedSpecialty) {
        throw new Error(`Invalid AI response — got: ${JSON.stringify(result)}`)
      }
      setTriageResult(result)

      // Backend already returns matchingDoctors in the triage response
      const doctors = result.matchingDoctors?.length > 0
        ? result.matchingDoctors
        : (await getDoctors({ specialization: result.recommendedSpecialty }))?.data?.data || []
      setMatchingDoctors(doctors)
      setSelectedDoctor(doctors[0] || null)
    } catch (err) {
      console.error('Triage error:', err)
      toast.error('AI triage failed: ' + (err.message || 'Unknown error'))
      setStep(1)
    }
  }

  const handleBookStep = () => {
    if (!selectedDoctor) {
      toast.error('Select a doctor')
      return
    }
    setStep(3)
  }

  const loadSlots = async (selectedDate) => {
    if (!selectedDoctor || !selectedDate) return
    const slotsResponse = await getDoctorSlots(selectedDoctor._id, selectedDate)
    const list = slotsResponse?.data?.slots || slotsResponse?.slots || []
    setSlots(list)
  }

  const onBookAppointment = async (event) => {
    event.preventDefault()
    if (!date || !timeSlot) {
      toast.error('Select date and time slot')
      return
    }

    try {
      const profileRes = await getMyProfile()
      const patient = profileRes?.data || profileRes
      if (!patient?._id) {
        toast.error('Patient profile not found. Make sure your profile is set up.')
        return
      }

      await createAppointment({
        patient: patient._id,
        doctor: selectedDoctor._id,
        date,
        timeSlot,
        type: triageResult?.appointmentType || 'general',
        priorityLevel: triageResult?.priorityLevel || 'medium',
        aiSuggestedSpecialty: triageResult?.recommendedSpecialty,
        aiPriorityScore: triageResult?.priorityScore,
        symptoms,
      })

      toast.success('Appointment booked!')
      navigate('/appointments')
    } catch (err) {
      console.error('Booking error:', err)
      toast.error(err?.response?.data?.message || err?.message || 'Failed to book appointment')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <div className="p-2 bg-[var(--accent)] text-white rounded-lg"><Brain size={24} /></div>
          AI Symptom Triage
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">Describe your symptoms to get intelligently routed to the right specialist.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--border)] -z-10 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--accent)] -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        
        {[1, 2, 3].map((num) => (
          <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= num ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30' : 'bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-[var(--text-muted)]'}`}>
            {step > num ? <CheckCircle size={20} /> : num}
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SYMPTOMS */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Tell us your symptoms</h2>
                <p className="text-sm text-[var(--text-secondary)]">Please be as specific as possible.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">Add Symptom</label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="e.g. Sharp pain in lower back"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                  />
                  <Button type="button" variant="secondary" onClick={addSymptom} icon={Plus}>Add</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                <AnimatePresence>
                  {symptoms.map((symptom) => (
                    <motion.span
                      key={symptom}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                    >
                      {symptom}
                      <button type="button" onClick={() => removeSymptom(symptom)} className="text-[var(--accent)] hover:text-teal-700 focus:outline-none">
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                  {symptoms.length === 0 && (
                    <span className="text-sm text-[var(--text-muted)] italic self-center">No symptoms added yet.</span>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 block">Age</label>
                  <Input type="number" placeholder="Years" {...register('patientAge')} error={errors.patientAge?.message} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 block">Gender</label>
                  <select className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 outline-none transition-colors" {...register('patientGender')}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.patientGender && <span className="text-xs text-red-500 mt-1 block">{errors.patientGender.message}</span>}
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-[var(--border)] flex justify-end">
                <Button type="button" variant="primary" onClick={handleSubmit(handleAnalyze)} icon={Brain}>
                  Analyze Symptoms
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOADING & RESULTS */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full justify-center">
              
              {isLoading || (!triageResult && !aiUnavailable) ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-blue-500/30 border-b-blue-500 animate-spin-reverse"></div>
                    <Brain size={32} className="text-[var(--accent)] animate-pulse" />
                  </div>
                  <motion.p
                    key={loadingMsgIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-medium text-[var(--text-primary)]"
                  >
                    {loadingMessages[loadingMsgIdx]}
                  </motion.p>
                </div>
              ) : aiUnavailable ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle size={48} className="text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">AI Service Unavailable</h3>
                  <p className="text-[var(--text-secondary)]">Please contact the receptionist or try again later.</p>
                  <Button variant="secondary" className="mt-6" onClick={() => setStep(1)}>Go Back</Button>
                </div>
              ) : triageResult && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-2">Triage Complete</h2>
                      <p className="text-[var(--text-secondary)]">Based on your symptoms, here is our assessment.</p>
                    </div>
                    <Badge variant={triageResult.priorityLevel === 'critical' ? 'destructive' : triageResult.priorityLevel === 'high' ? 'warning' : 'default'} className="text-base px-4 py-1.5 uppercase tracking-wider">
                      {triageResult.priorityLevel} Priority
                    </Badge>
                  </div>

                  <Card className="bg-[var(--bg-secondary)]/50 p-5 border-[var(--border)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Recommended Specialty</p>
                        <p className="text-lg font-bold text-[var(--accent)]">{triageResult.recommendedSpecialty}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Suggested Appointment</p>
                        <p className="text-lg font-semibold text-[var(--text-primary)] capitalize">{triageResult.appointmentType}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Reasoning</p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{triageResult.reasoning}</p>
                      </div>
                    </div>
                  </Card>

                  {triageResult.redFlags?.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4">
                      <h3 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2 mb-2"><AlertCircle size={18}/> Red Flags Detected</h3>
                      <ul className="list-disc pl-5 text-sm text-red-600 dark:text-red-300 space-y-1">
                        {triageResult.redFlags.map((flag) => <li key={flag}>{flag}</li>)}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recommended Specialists</h3>
                    {matchingDoctors.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">No doctors found for this specialty.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {matchingDoctors.map((doc) => (
                          <div
                            key={doc._id}
                            onClick={() => setSelectedDoctor(doc)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selectedDoctor?._id === doc._id ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`}
                          >
                            <Avatar name={doc.user?.name || doc.name || 'Dr.'} src={doc.user?.avatar} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[var(--text-primary)] truncate">Dr. {doc.user?.name || doc.name}</p>
                              <p className="text-xs text-[var(--text-secondary)]">{doc.specialization}</p>
                              <div className="flex items-center gap-1 mt-1 text-yellow-500">
                                <Star size={12} fill="currentColor" />
                                <span className="text-xs font-medium text-[var(--text-primary)]">4.8</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedDoctor?._id === doc._id ? 'border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                              {selectedDoctor?._id === doc._id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-6 border-t border-[var(--border)] flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    <Button variant="primary" onClick={handleBookStep} disabled={!selectedDoctor}>Continue to Booking</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: BOOKING */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Confirm Appointment</h2>
                <p className="text-sm text-[var(--text-secondary)]">Select a date and time for your consultation.</p>
              </div>

              <Card className="p-4 flex items-center gap-4 bg-[var(--bg-secondary)]/50">
                <Avatar name={selectedDoctor?.user?.name || 'Dr.'} size="lg" />
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-lg">Dr. {selectedDoctor?.user?.name || selectedDoctor?.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{triageResult?.recommendedSpecialty} • {triageResult?.appointmentType} Visit</p>
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-2"><Calendar size={16}/> Select Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      setTimeSlot('')
                      loadSlots(e.target.value)
                    }}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-2"><Clock size={16}/> Select Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    disabled={!date || slots.length === 0}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 outline-none disabled:opacity-50"
                  >
                    <option value="">{slots.length === 0 && date ? 'No slots available' : 'Select a time slot'}</option>
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-[var(--border)] flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Back to Results</Button>
                <Button variant="primary" onClick={onBookAppointment} disabled={!date || !timeSlot}>Book Appointment</Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default AITriage
