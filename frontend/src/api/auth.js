import apiClient from './apiClient.js'

export const login = async (email, password) => {
  const { data } = await apiClient.post('/auth/login', { email, password })
  return data
}

export const register = async (payload) => {
  const { data } = await apiClient.post('/auth/register', payload)
  return data
}

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me')
  return data
}
