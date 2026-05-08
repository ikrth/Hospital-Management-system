import apiClient from './apiClient.js'

export const getPatients = async (params) => {
  const { data } = await apiClient.get('/patients', { params })
  return data
}

export const getPatientById = async (id) => {
  const { data } = await apiClient.get(`/patients/${id}`)
  return data
}

export const getMyProfile = async () => {
  const { data } = await apiClient.get('/patients/me')
  return data
}

export const updatePatient = async (id, payload) => {
  const { data } = await apiClient.put(`/patients/${id}`, payload)
  return data
}

export const updateMyProfile = async (payload) => {
  const { data } = await apiClient.patch('/patients/me', payload)
  return data
}

export const deletePatient = async (id) => {
  const { data } = await apiClient.delete(`/patients/${id}`)
  return data
}
