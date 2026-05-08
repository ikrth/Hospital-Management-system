import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getAppointments,
  createAppointment,
  cancelAppointment,
  getAppointmentById,
} from '../api/appointments.js'

export const useAppointments = (filters = {}) => {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => getAppointments(filters),
  })

  const appointments = data?.data?.data || data?.data || []
  const pagination = data?.data?.meta || data?.meta || {}

  return { appointments, pagination, isLoading, error }
}

export const useCancelAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      toast.success('Appointment cancelled')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel appointment')
    }
  })
}

export const useCreateAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      toast.success('Appointment created')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => {
      // if the API returned field-level validation info, attach to toast
      if (err && err.fieldErrors) {
        // don't show a generic toast when validation fields exist
        Object.values(err.fieldErrors).forEach((m) => toast.error(String(m)))
      } else {
        toast.error(err.message || 'Failed to create appointment')
      }
    }
  })
}
