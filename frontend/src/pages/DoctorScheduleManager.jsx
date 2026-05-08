import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctors, updateDoctorSlots } from '../api/doctors'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  User, 
  ChevronRight,
  Info
} from 'lucide-react'
import { Card, Button, Badge, Skeleton, Modal } from '../components/common'
import toast from 'react-hot-toast'
import { cn } from '../utils/cn'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function DoctorScheduleManager() {
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [editingSlots, setEditingSlots] = useState([])
  const queryClient = useQueryClient()

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors', 'admin-list'],
    queryFn: () => getDoctors(),
  })

  const updateSlotsMutation = useMutation({
    mutationFn: ({ id, slots }) => updateDoctorSlots(id, slots),
    onSuccess: () => {
      toast.success('Schedule updated successfully')
      queryClient.invalidateQueries(['doctors'])
      setSelectedDoctor(null)
    },
    onError: () => toast.error('Failed to update schedule')
  })

  const doctors = doctorsData?.data?.data || doctorsData?.data || []

  const handleEdit = (doc) => {
    setSelectedDoctor(doc)
    setEditingSlots(doc.availableSlots || [])
  }

  const addSlot = (day) => {
    setEditingSlots([...editingSlots, { day, startTime: '09:00', endTime: '17:00' }])
  }

  const removeSlot = (index) => {
    setEditingSlots(editingSlots.filter((_, i) => i !== index))
  }

  const updateSlot = (index, field, value) => {
    const newSlots = [...editingSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setEditingSlots(newSlots)
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Calendar className="text-[var(--accent)]" /> Doctor Schedule Manager
        </h2>
        <p className="text-[var(--text-secondary)]">Configure weekly availability for medical staff</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="font-bold text-lg mb-2">Medical Staff</h3>
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} variant="card" className="h-20" />)
          ) : doctors.map(doc => (
            <button
              key={doc._id}
              onClick={() => handleEdit(doc)}
              className={cn(
                "w-full text-left transition-all",
                selectedDoctor?._id === doc._id ? "ring-2 ring-[var(--accent)] rounded-2xl" : ""
              )}
            >
              <Card hover className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent)]">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Dr. {doc.user?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{doc.specialization}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)]" />
              </Card>
            </button>
          ))}
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-2">
          {selectedDoctor ? (
            <Card className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Edit Schedule</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Dr. {selectedDoctor.user?.name}</p>
                </div>
                <Button 
                  variant="primary" 
                  icon={Save}
                  onClick={() => updateSlotsMutation.mutate({ id: selectedDoctor._id, slots: editingSlots })}
                  isLoading={updateSlotsMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>

              <div className="space-y-8">
                {DAYS.map(day => (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)]">{day}</h4>
                      <Button variant="ghost" size="sm" icon={Plus} onClick={() => addSlot(day)}>Add Slot</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editingSlots.filter(s => s.day === day).length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic py-2">No slots defined for this day</p>
                      ) : editingSlots.map((slot, idx) => {
                        if (slot.day !== day) return null
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-[var(--bg-secondary)]/50 p-2 rounded-xl border border-[var(--border)]">
                            <Clock size={14} className="text-[var(--text-muted)] shrink-0 ml-1" />
                            <input 
                              type="time" 
                              value={slot.startTime}
                              onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                              className="bg-transparent text-xs font-bold w-full focus:outline-none"
                            />
                            <span className="text-[var(--text-muted)] text-xs">to</span>
                            <input 
                              type="time" 
                              value={slot.endTime}
                              onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                              className="bg-transparent text-xs font-bold w-full focus:outline-none"
                            />
                            <button 
                              onClick={() => removeSlot(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-20 text-center flex flex-col items-center gap-4 bg-[var(--bg-secondary)]/30 border-dashed">
              <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-full flex items-center justify-center text-[var(--text-muted)]">
                <Calendar size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Select a doctor to manage schedule</h3>
                <p className="text-sm text-[var(--text-secondary)]">Their weekly availability will appear here for editing.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
