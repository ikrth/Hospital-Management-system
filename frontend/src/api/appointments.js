import apiClient from './apiClient.js'

export const getAppointments = async (params) => {
  const { data } = await apiClient.get('/appointments', { params })
  return data
}

export const createAppointment = async (payload) => {
  const { data } = await apiClient.post('/appointments', payload)
  return data
}

export const cancelAppointment = async (id) => {
  const { data } = await apiClient.put(`/appointments/${id}/cancel`)
  return data
}

export const getAppointmentById = async (id) => {
  const { data } = await apiClient.get(`/appointments/${id}`)
  return data
}

export const updateAppointmentStatus = async (id, status) => {
  const { data } = await apiClient.put(`/appointments/${id}`, { status })
  return data
}
