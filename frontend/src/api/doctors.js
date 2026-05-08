import apiClient from './apiClient.js'

export const getDoctors = async (params) => {
  const { data } = await apiClient.get('/doctors', { params })
  return data
}

export const getDoctorById = async (id) => {
  const { data } = await apiClient.get(`/doctors/${id}`)
  return data
}

export const getDoctorSlots = async (id, date) => {
  const { data } = await apiClient.get(`/doctors/${id}/slots`, {
    params: { date },
  })
  return data
}

export const deleteDoctor = async (id) => {
  const { data } = await apiClient.delete(`/doctors/${id}`)
  return data
}

export const updateDoctor = async (id, payload) => {
  const { data } = await apiClient.patch(`/doctors/${id}`, payload)
  return data
}

export const updateDoctorSlots = async (id, availableSlots) => {
  const { data } = await apiClient.patch(`/doctors/${id}/slots`, { availableSlots })
  return data
}
