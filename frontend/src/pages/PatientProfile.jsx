import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getMyProfile, updateMyProfile } from '../api/patients'
import { useAuthStore } from '../store/authStore'
import { UserCircle, Phone, MapPin, Heart, Shield, Edit2, Check, X, Plus } from 'lucide-react'
import { Button, Input, Card, Badge, Avatar } from '../components/common'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-3 border-b border-[var(--border)] last:border-0">
      <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

export default function PatientProfile() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [medHistoryTag, setMedHistoryTag] = useState('')
  const [allergyTag, setAllergyTag] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    enabled: user?.role === 'patient',
  })

  const profile = data?.data || null

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      phone: '',
      gender: '',
      bloodGroup: '',
      dateOfBirth: '',
      address: { street: '', city: '', zip: '' },
      medicalHistory: [],
      allergies: [],
      emergencyContact: { name: '', phone: '', relation: '' },
      insurance: { provider: '', policyNumber: '' }
    }
  })

  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone || '',
        gender: profile.gender || '',
        bloodGroup: profile.bloodGroup || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          zip: profile.address?.zip || ''
        },
        medicalHistory: profile.medicalHistory || [],
        allergies: profile.allergies || [],
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || '',
          relation: profile.emergencyContact?.relation || ''
        },
        insurance: {
          provider: profile.insurance?.provider || '',
          policyNumber: profile.insurance?.policyNumber || ''
        }
      })
    }
  }, [profile, reset])

  const currentMedHistory = watch('medicalHistory') || []
  const currentAllergies = watch('allergies') || []

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries(['my-profile'])
      setIsEditing(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    }
  })

  const onSubmit = (formData) => {
    updateMutation.mutate(formData)
  }

  const addMedHistory = () => {
    if (medHistoryTag.trim() && !currentMedHistory.includes(medHistoryTag.trim())) {
      setValue('medicalHistory', [...currentMedHistory, medHistoryTag.trim()])
    }
    setMedHistoryTag('')
  }

  const removeMedHistory = (tag) => {
    setValue('medicalHistory', currentMedHistory.filter(t => t !== tag))
  }

  const addAllergy = () => {
    if (allergyTag.trim() && !currentAllergies.includes(allergyTag.trim())) {
      setValue('allergies', [...currentAllergies, allergyTag.trim()])
    }
    setAllergyTag('')
  }

  const removeAllergy = (tag) => {
    setValue('allergies', currentAllergies.filter(t => t !== tag))
  }

  if (user?.role !== 'patient') {
    return (
      <div className="flex flex-col gap-4 animate-fade-in max-w-2xl mx-auto p-6">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">My Profile</h2>
        <Card className="p-8 text-center flex flex-col items-center">
          <UserCircle size={64} className="text-[var(--text-muted)] mb-4" />
          <p className="font-semibold text-lg text-[var(--text-primary)]">
            Profile management is available for patients only.
          </p>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--border)] rounded mb-2" />
        <div className="h-32 bg-[var(--border)] rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-[var(--border)] rounded-2xl w-full" />
          <div className="h-64 bg-[var(--border)] rounded-2xl w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">My Profile</h2>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)} icon={Edit2}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setIsEditing(false); reset(); }} icon={X}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={updateMutation.isPending} icon={Check}>Save Changes</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Personal Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-[var(--accent)]/10" />
            <Avatar name={user?.name || 'Patient'} size="xl" className="border-4 border-[var(--bg-card)] shadow-sm mb-4 relative z-10" />
            <h3 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-1 relative z-10">{user?.name}</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-3 relative z-10">{user?.email}</p>
            <Badge variant="default" className="bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 border-0 font-bold uppercase tracking-wider relative z-10">Patient</Badge>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
              <UserCircle size={18} className="text-[var(--accent)]" /> Personal Details
            </h4>
            
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <Input label="Phone Number" placeholder="+1 234 567 8900" {...register('phone')} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Gender</label>
                    <select className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 outline-none transition-colors" {...register('gender')}>
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input label="Blood Group" placeholder="O+" {...register('bloodGroup')} />
                </div>
                <Input label="Date of Birth" type="date" {...register('dateOfBirth')} />
              </div>
            ) : (
              <div className="flex flex-col">
                <InfoRow label="Phone" value={profile?.phone || 'Not provided'} />
                <InfoRow label="Gender" value={profile?.gender || 'Not provided'} />
                <InfoRow label="Blood Group" value={profile?.bloodGroup || 'Not provided'} />
                <InfoRow label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'} />
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
              <MapPin size={18} className="text-[var(--accent)]" /> Address
            </h4>
            
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <Input label="Street Address" placeholder="123 Main St" {...register('address.street')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" placeholder="New York" {...register('address.city')} />
                  <Input label="ZIP Code" placeholder="10001" {...register('address.zip')} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <InfoRow label="Street" value={profile?.address?.street || 'Not provided'} />
                <InfoRow label="City" value={profile?.address?.city || 'Not provided'} />
                <InfoRow label="ZIP" value={profile?.address?.zip || 'Not provided'} />
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Medical Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6 border-t-4 border-t-red-500">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6 border-b border-[var(--border)] pb-2">
              <Heart size={18} className="text-red-500" /> Medical Information
            </h4>
            
            <div className="mb-8">
              <h5 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Medical History</h5>
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input className="flex-1" placeholder="e.g. Hypertension" value={medHistoryTag} onChange={(e) => setMedHistoryTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMedHistory())} />
                    <Button type="button" variant="secondary" onClick={addMedHistory} icon={Plus}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[30px]">
                    {currentMedHistory.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]">
                        {tag} <button type="button" onClick={() => removeMedHistory(tag)} className="text-[var(--text-muted)] hover:text-red-500"><X size={14}/></button>
                      </span>
                    ))}
                    {currentMedHistory.length === 0 && <span className="text-sm text-[var(--text-muted)] italic">No medical history added.</span>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.medicalHistory?.length > 0 ? profile.medicalHistory.map((h) => (
                    <Badge key={h} variant="secondary">{h}</Badge>
                  )) : <span className="text-sm text-[var(--text-muted)] italic">No medical history recorded.</span>}
                </div>
              )}
            </div>

            <div>
              <h5 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Allergies</h5>
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input className="flex-1" placeholder="e.g. Penicillin" value={allergyTag} onChange={(e) => setAllergyTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())} />
                    <Button type="button" variant="secondary" onClick={addAllergy} icon={Plus}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[30px]">
                    {currentAllergies.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                        {tag} <button type="button" onClick={() => removeAllergy(tag)} className="hover:text-red-900 dark:hover:text-red-300"><X size={14}/></button>
                      </span>
                    ))}
                    {currentAllergies.length === 0 && <span className="text-sm text-[var(--text-muted)] italic">No allergies added.</span>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.allergies?.length > 0 ? profile.allergies.map((a) => (
                    <Badge key={a} variant="destructive">{a}</Badge>
                  )) : <span className="text-sm text-[var(--text-muted)] italic">No allergies recorded.</span>}
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                <Phone size={18} className="text-green-500" /> Emergency Contact
              </h4>
              {isEditing ? (
                <div className="flex flex-col gap-4">
                  <Input label="Name" placeholder="John Doe" {...register('emergencyContact.name')} />
                  <Input label="Relation" placeholder="Spouse" {...register('emergencyContact.relation')} />
                  <Input label="Phone" placeholder="+1 234 567 8900" {...register('emergencyContact.phone')} />
                </div>
              ) : (
                <div className="flex flex-col">
                  <InfoRow label="Name" value={profile?.emergencyContact?.name || 'Not provided'} />
                  <InfoRow label="Relation" value={profile?.emergencyContact?.relation || 'Not provided'} />
                  <InfoRow label="Phone" value={profile?.emergencyContact?.phone || 'Not provided'} />
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
                <Shield size={18} className="text-blue-500" /> Insurance Details
              </h4>
              {isEditing ? (
                <div className="flex flex-col gap-4">
                  <Input label="Provider" placeholder="Blue Cross" {...register('insurance.provider')} />
                  <Input label="Policy Number" placeholder="POL-12345" {...register('insurance.policyNumber')} />
                </div>
              ) : (
                <div className="flex flex-col">
                  <InfoRow label="Provider" value={profile?.insurance?.provider || 'Not provided'} />
                  <InfoRow label="Policy Number" value={profile?.insurance?.policyNumber || 'Not provided'} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
